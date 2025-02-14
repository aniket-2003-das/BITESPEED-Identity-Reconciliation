# Bitespeed Backend Task

This is a backend service designed to identify and consolidate customer contact information across multiple purchases. The service links contacts based on shared email or phone number, maintains the oldest contact as the primary, and returns a consolidated view of the contact information.

## Features

- **Contact Identification**: Links contacts based on shared email or phone number.
- **Primary/Secondary Contacts**: Maintains the oldest contact as primary and links newer contacts as secondary.
- **Consolidated Response**: Returns a unified view of all linked contacts.
- **Database Integration**: Uses MySQL with Prisma ORM for database management.
- **REST API**: Exposes a single `/identify` endpoint for contact identification.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Hosting**: Render.com
- **Version Control**: Git, GitHub

## API Documentation

### Endpoint

#### `POST /identify`

Identifies or creates a contact based on email or phone number.

### Request Body

```json
{
  "email"?: "string",
  "phoneNumber"?: "string | number"
}
```

### Response

```json
{
  "contact": {
    "primaryContatctId": number,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": ["number"]
  }
}
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MySQL (v8.0+)
- Git

### Local Setup

#### Clone the Repository

```bash
git clone https://github.com/aniket-2003-das/BITESPEED-Identity-Reconciliation.git
cd bitespeed-backend
```

#### Install Dependencies

```bash
npm install
```

#### Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="mysql://user:password@host:port/database_name"
PORT=3000
```

#### Run Database Migrations

```bash
npx prisma migrate dev --name init
```

#### Start the Server

```bash
npm run dev
```

#### Test the API

Use Postman or `curl` to send requests to `http://localhost:3000/identify`.

## Deployment to Render

### Create a Render Account

- Sign up at Render.

### Create a New Web Service

- Connect your GitHub repository.
- Set the following environment variables:

```env
DATABASE_URL="mysql://user:password@host:port/database_name"
PORT=3000
```

### Build and Start Commands

#### Build Command

```bash
npm install && npm run build
```

#### Start Command

```bash
npm start
```

### Deploy

Click Deploy and wait for the build to complete.

## Testing

### Test Cases

#### Case 1: New Contact

**Request:**

```json
{
  "email": "test@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["test@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

#### Case 2: Existing Contact

**Request:**

```json
{
  "email": "test@example.com",
  "phoneNumber": "1234567890"
}
```

**Response (same as above).**

#### Case 3: New Email, Same Phone

**Request:**

```json
{
  "email": "new@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["test@example.com", "new@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2]
  }
}
```

## Database Schema

### Contact Table

```prisma
model Contact {
  id             Int       @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  @@index([email])
  @@index([phoneNumber])
  @@index([linkedId])
}
```

## Contributing

1. Fork the repository.  
2. Create a new branch:  

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:  

   ```bash
   git commit -m "Add your feature"
   ```

4. Push to the branch:  

   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request.  

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.  

## Contact

For questions or feedback, reach out to:  

- **Your Name**  
- **Email**: [aniketdas8822@gmail.com](mailto:aniketdas8822@gmail.com)  
- **GitHub**: [ANIKET DAS](https://github.com/aniket-2003-das)  
