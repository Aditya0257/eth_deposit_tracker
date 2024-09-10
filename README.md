# Ethereum Deposit Tracker

## Overview

The Ethereum Deposit Tracker is a project designed to monitor and record ETH deposits on the Beacon Deposit Contract. It uses JSON RPC for data fetching and Prisma with PostgreSQL for data storage. The application is built with Node.js, Express, and TypeScript, and is containerized using Docker.

## Features

- Track Ethereum deposits on the Beacon Deposit Contract using JSON RPC.
- Store deposit records in a PostgreSQL database with Prisma.
- Containerized setup with Docker and Docker Compose.
- Automated database migration and seeding.

## File Structure

```
/project-root
│
├── /docker
│   ├── Dockerfile.eth_webhook
│
├── /prisma
│   └── schema.prisma
│
├── /src
│   └── index.ts
│   └── seed.ts
│
├── /scripts
│   └── start.sh
│
├── docker-compose.yml
├── .env.example
└── package.json
└── tsconfig.json
```

## Setup

### Prerequisites

- Docker and Docker Compose installed.
- Node.js (for local development and testing).

### Configuration

1. Clone the Repository
   ```
   git clone https://github.com/Aditya0257/luganodes-be
   cd luganodes-be
   ```

2. Create Environment File
   Copy `.env.example` to `.env` and update it with your database credentials and other environment variables:
   
   ```
   DATABASE_URL=<postgresql://postgres:postgres@db:5432/eth_deposits> (Your DB URL)
   POSTGRES_USER=user
   POSTGRES_PASSWORD=password
   POSTGRES_DB=mydatabase
   ```

3. Build and Run with Docker Compose
   To build and run the application along with PostgreSQL, use the following commands:
   ```
   docker-compose build
   docker-compose up
   ```
   The application will run, and migrations will be applied automatically.

## Usage

1. Migrations and Seeding
   The `db:setup` script in the `package.json` handles database migrations and seeding. This script will be run automatically when starting the container with Docker Compose.

   For local development, you can run:
   ```
   npm run db:setup
   ```

2. Starting the Application
   The application is configured to start automatically with Docker Compose. It will execute the build process and then start the Express server.

   For local development, you can build and start the application with:
   ```
   npm run build
   npm start
   ```

### Real Time Data Fetching

The application uses a combination of Alchemy webhooks and JSON RPC methods to fetch and process data related to Ethereum deposits.

- **Alchemy Webhooks**: The endpoint `https://luganodes.corevision.live/txntracker` receives real-time data for deposits on the Beacon Deposit Contract. This webhook provides updates on deposit events as they occur.

- **JSON RPC with Axios**: For fetching additional data, such as public keys, that is not provided by the webhook, the application uses Axios to make JSON RPC calls. These calls are made to the Ethereum network to fetch details such as public keys for the deposits.

### PostgreSQL Setup

The PostgreSQL database is used to store deposit records and other relevant data. In the Docker Compose setup, the database is configured with the following details:

- **PostgreSQL Database URL**: `postgresql://postgres:postgres@db:5432/eth_deposits`

- **Docker Compose Configuration**: The database is set up as an ephemeral container in Docker Compose. This means that data will not be persisted between container restarts or rebuilds. If persistent storage is needed, additional configuration for Docker volumes would be required.

**Note:** In the current setup, the PostgreSQL container does not persist data. For local development or testing, this configuration is sufficient, but for production environments, consider configuring Docker volumes for persistent storage.

## Examples

### Running the Application

After setting up and running Docker Compose, your application will be accessible as per the configuration in `docker-compose.yml`. Typically, it will be available at `http://localhost:3000`.

### Database Seeding

The seeding script (`src/seed.ts`) inserts the latest 5 transactions from the Beacon Deposit Contract into the database. This script will be executed automatically when you run the `db:setup` script.

## Troubleshooting

- Docker Issues: Ensure Docker and Docker Compose are correctly installed and running.
- Database Connection: Verify that the PostgreSQL container is up and the credentials in `.env` are correct.
- TypeScript Errors: Ensure all TypeScript dependencies are installed and properly configured.

## Contributing

Feel free to open issues or submit pull requests to improve the project. Contributions are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For any questions or feedback, please contact [adityasinghthakur.0257@gmail.com](mailto:adityasinghthakur.0257@gmail.com).
