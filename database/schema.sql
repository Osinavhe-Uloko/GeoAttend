-- PostgreSQL Schema for GPS-Based Attendance Management System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL CHECK (role_name IN ('student', 'lecturer', 'admin'))
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id),
    matric_number VARCHAR(50) UNIQUE, -- Nullable for lecturers/admins
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    requires_password_change BOOLEAN DEFAULT FALSE
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    lecturer_id UUID NOT NULL REFERENCES users(user_id),
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(user_id),
    course_id UUID NOT NULL REFERENCES courses(course_id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Geofence Zones Table
CREATE TABLE IF NOT EXISTS geofence_zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 100,
    course_id UUID REFERENCES courses(course_id), -- Optional: zone can be tied to a course or general
    created_by UUID NOT NULL REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lecture Sessions Table
CREATE TABLE IF NOT EXISTS lecture_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(course_id),
    geofence_zone_id UUID NOT NULL REFERENCES geofence_zones(zone_id),
    session_code VARCHAR(10) UNIQUE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(user_id),
    session_id UUID NOT NULL REFERENCES lecture_sessions(session_id),
    submitted_latitude DECIMAL(10,8) NOT NULL,
    submitted_longitude DECIMAL(11,8) NOT NULL,
    haversine_distance_meters DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'rejected', 'flagged')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    UNIQUE(student_id, session_id) -- Prevent multiple successful attendances per session
);

-- Device Logs Table
CREATE TABLE IF NOT EXISTS device_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    device_fingerprint VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login', 'attendance_attempt', 'geofence_fail', 'spoof_alert')),
    event_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_matric ON users(matric_number);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_user ON device_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON lecture_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_time ON lecture_sessions(start_time, end_time);
