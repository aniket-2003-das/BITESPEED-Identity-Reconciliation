import express from 'express';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Use built-in JSON parser


app.post('/identify', async (req, res): Promise<any> => {
    // console.log('Received Body:', req.body);  // Debugging line
    const { email, phoneNumber } = req.body;
    // console.log('Parsed email:', email, 'Parsed phoneNumber:', phoneNumber); // Debugging line

    if (!email && !phoneNumber) {
        res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
        return;
    }

    try {
        const existingContacts = await prisma.contact.findMany({
            where: {
                OR: [{ email: email || undefined }, { phoneNumber: phoneNumber?.toString() || undefined }],
                deletedAt: null,
            },
        });

        if (existingContacts.length === 0) {
            const newContact = await prisma.contact.create({
                data: {
                    email: email || undefined,
                    phoneNumber: phoneNumber?.toString() || undefined,
                    linkPrecedence: 'primary',
                },
            });

            res.json({
                contact: {
                    primaryContatctId: newContact.id,
                    emails: newContact.email ? [newContact.email] : [],
                    phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
                    secondaryContactIds: [],
                },
            });
            return;
        }

        const primaryContacts = await Promise.all(
            existingContacts.map(async (contact) => {
                let currentContact = contact;
                while (currentContact.linkedId) {
                    const linkedContact = await prisma.contact.findUnique({ where: { id: currentContact.linkedId } });
                    if (!linkedContact) break;
                    currentContact = linkedContact;
                }
                return currentContact;
            })
        );

        const uniquePrimaryContacts = Array.from(new Map(primaryContacts.map((p) => [p.id, p])).values());
        const sortedPrimaryContacts = uniquePrimaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const mainPrimary = sortedPrimaryContacts[0];

        let createSecondary = false;
        let clusterContacts: any[] = [];

        await prisma.$transaction(async (tx) => {
            await Promise.all(
                sortedPrimaryContacts.slice(1).map((primary) =>
                    tx.contact.update({
                        where: { id: primary.id },
                        data: { linkPrecedence: 'secondary', linkedId: mainPrimary.id },
                    })
                )
            );

            clusterContacts = await tx.$queryRaw`
                WITH RECURSIVE linked_contacts AS (
                    SELECT id, linkedId, email, phoneNumber, linkPrecedence, createdAt
                    FROM Contact
                    WHERE id = ${mainPrimary.id}
                    UNION ALL
                    SELECT c.id, c.linkedId, c.email, c.phoneNumber, c.linkPrecedence, c.createdAt
                    FROM Contact c
                    INNER JOIN linked_contacts lc ON c.linkedId = lc.id
                    WHERE c.deletedAt IS NULL
                )
                SELECT * FROM linked_contacts;
            `;

            const existingEmails = new Set(clusterContacts.map((c) => c.email).filter(Boolean));
            const existingPhones = new Set(clusterContacts.map((c) => c.phoneNumber).filter(Boolean));

            createSecondary = (email && !existingEmails.has(email)) || (phoneNumber && !existingPhones.has(phoneNumber?.toString()));

            if (createSecondary) {
                await tx.contact.create({
                    data: {
                        email: email || undefined,
                        phoneNumber: phoneNumber?.toString() || undefined,
                        linkedId: mainPrimary.id,
                        linkPrecedence: 'secondary',
                    },
                });
            }
        });

        const updatedCluster: any[] = await prisma.$queryRaw`
            WITH RECURSIVE linked_contacts AS (
                SELECT id, linkedId, email, phoneNumber, linkPrecedence, createdAt
                FROM Contact
                WHERE id = ${mainPrimary.id}
                UNION ALL
                SELECT c.id, c.linkedId, c.email, c.phoneNumber, c.linkPrecedence, c.createdAt
                FROM Contact c
                INNER JOIN linked_contacts lc ON c.linkedId = lc.id
                WHERE c.deletedAt IS NULL
            )
            SELECT * FROM linked_contacts ORDER BY createdAt;
        `;

        const emails = new Set();
        const phoneNumbers = new Set();
        const secondaryContactIds: number[] = [];


        updatedCluster.forEach((contact) => {
            if (contact.id !== mainPrimary.id) secondaryContactIds.push(contact.id);
            if (contact.email) emails.add(contact.email);
            if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
        });

        res.json({
            contact: {
                primaryContatctId: mainPrimary.id,
                emails: [...emails],
                phoneNumbers: [...phoneNumbers],
                secondaryContactIds,
            },
        });
    } catch (error) {
        console.error('Full error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
