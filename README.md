# Inventory Management System

A comprehensive inventory management system built with React, TypeScript, and MySQL.

## Features

- **Inventory Management**: Manage deliveries, stock cards, and inventory records
- **Procurement**: Handle purchase orders and supplier management
- **User Management**: Admin panel for user and role management
- **Reporting**: Generate various inventory reports (IAR, RIS, RSMI, RPCI)
- **Data Export**: Export data to Excel format

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Router
- React Hook Form
- Recharts
- ExcelJS

### Backend
- Node.js
- Express
- MySQL2
- CORS

## Project Structure

```
Inventory_Management/
├── src/                    # Frontend source code
│   ├── app/               # Main application components
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── context/          # React context providers
│   └── types/            # TypeScript type definitions
├── backend/              # Backend API server
│   ├── server.js         # Express server
│   ├── package.json      # Backend dependencies
│   └── schema.sql        # Database schema
├── api/                  # Vercel-compatible API
│   ├── server.js         # API server for deployment
│   └── package.json      # API dependencies
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Inventory_Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm --prefix backend install
   ```

3. **Set up database**
   - Import `backend/schema.sql` into your MySQL database
   - Update database connection settings in `backend/server.js`

4. **Environment variables**
   Create a `.env` file in the root directory:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=inventory_db
   ```

5. **Start development servers**
   ```bash
   # Start frontend
   npm run dev
   
   # Start backend
   npm run server
   ```

## Deployment to Vercel

This project is configured for deployment on Vercel with both frontend and backend.

### Prerequisites
- Vercel account
- Vercel CLI installed (`npm install -g vercel`)

### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Environment Variables**
   After deployment, set the following environment variables in your Vercel project settings:
   - `DB_HOST`: Your MySQL host
   - `DB_USER`: Your MySQL username
   - `DB_PASSWORD`: Your MySQL password
   - `DB_NAME`: Your MySQL database name

### Configuration Files

- `vercel.json`: Vercel deployment configuration
- `api/`: Backend API configured for Vercel serverless functions
- `vite.config.ts`: Frontend build configuration

## API Endpoints

The backend provides RESTful APIs for:

- `/api/deliveries` - Delivery management
- `/api/users` - User management
- `/api/ssnItems` - SSN item management
- `/api/rccItems` - RCC item management
- `/api/iarRecords` - IAR record management
- `/api/risRecords` - RIS record management
- `/api/rsmiRecords` - RSMI record management
- `/api/stockCards` - Stock card management
- `/api/rpciRecords` - RPCI record management

## Development

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run build` - Build frontend for production
- `npm run backend` - Start backend server (from root)

### Adding New Features

1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Update routes in `src/routes.tsx`
4. Add API endpoints in `api/server.js`
5. Update database schema in `backend/schema.sql` if needed

## Database Schema

The system uses MySQL with the following main tables:
- `deliveries` - Delivery records
- `users` - User accounts
- `ssn_items` - SSN items
- `rcc_items` - RCC items
- `iar_records` - Inspection and Acceptance Records
- `ris_records` - Requisition and Issue Slips
- `rsmi_records` - Report of Supplies and Materials Issued
- `stock_cards` - Stock card transactions
- `rpci_records` - Report of Physical Count of Inventory

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support and questions:
- Check the [Issues](https://github.com/your-repo/issues) section
- Create a new issue for bug reports or feature requests