# GPS-Based Attendance Management System

A robust, full-stack GPS-based attendance management system built for secure, location-verified attendance assessment.

## Features
- **Geofencing**: Validates student location against predefined lecture zones using the Haversine formula.
- **Anomaly Detection**: Flags impossible distances, time mismatches, boundary hopping, and GPS spoofing.
- **Role-Based Access Control**: Separate dashboards and permissions for Students, Lecturers, and Admins.
- **Device Fingerprinting**: Tracks devices to prevent proxy attendance.
- **Audit Trail**: Logs sensitive actions for accountability.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Leaflet.js, React Router
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Security**: JWT (HTTP-only cookies), bcrypt

## Setup Instructions

1. **Database Setup**:
   - Install PostgreSQL.
   - Create a database (e.g., `attendance_db`).
   - Run the SQL script located in `database/schema.sql` to create the tables and indexes.

2. **Environment Variables**:
   - Copy `.env.example` to `.env`.
   - Update `DATABASE_URL` with your PostgreSQL connection string.
   - Set a secure `JWT_SECRET`.

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run the Application**:
   ```bash
   npm run dev
   ```

## Seeding the Database (Initial Admin)
To create the first admin user, you can run this SQL command in your database:
```sql
-- Password is 'password123' (hashed)
INSERT INTO roles (role_name) VALUES ('admin'), ('lecturer'), ('student');

INSERT INTO users (full_name, email, password_hash, role_id, is_active) 
VALUES ('System Admin', 'admin@university.edu', '$2b$12$eImiTXuWVxfM37uY4JANjQ==', 1, true);
```

## API Testing
Use Postman or a similar tool to test the API endpoints. Ensure you include the JWT cookie in your requests after logging in.
