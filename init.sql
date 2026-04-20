CREATE TYPE "UserRole" AS ENUM ('TENANT', 'LANDLORD', 'SERVICE_PROVIDER', 'SOCIETY_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT');

CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    role "UserRole" NOT NULL DEFAULT 'TENANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Module" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    label TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Feature" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    "moduleId" TEXT NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "RoleFeature" (
    role "UserRole" NOT NULL,
    "featureId" TEXT NOT NULL REFERENCES "Feature"(id) ON DELETE CASCADE,
    PRIMARY KEY (role, "featureId")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SubscriptionFeature" (
    "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
    "featureId" TEXT NOT NULL REFERENCES "Feature"(id) ON DELETE CASCADE,
    PRIMARY KEY ("subscriptionId", "featureId")
);

CREATE TABLE IF NOT EXISTS "UserSubscription" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "subscriptionId" TEXT NOT NULL REFERENCES "Subscription"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS "Kyc" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "selfieUrl" TEXT,
    "livenessData" JSONB,
    "submittedAt" TIMESTAMP,
    "reviewedAt" TIMESTAMP,
    "reviewedBy" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KycDocument" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "kycId" TEXT NOT NULL REFERENCES "Kyc"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO "Module" (name, label)
VALUES
    ('PROPERTY', 'Property Management'),
    ('VISIT', 'Visit Management'),
    ('AGREEMENT', 'Agreement Management'),
    ('KYC', 'KYC Verification'),
    ('SLAAS', 'SLAAS Service'),
    ('SMART_AGREEMENT', 'Smart Agreement'),
    ('LOCAL_EXPERT', 'Local Expert Services'),
    ('MAINTENANCE', 'Maintenance Tracking'),
    ('PAYMENT_VAULT', 'Payment Vault'),
    ('DISPUTE', 'Dispute Resolution'),
    ('SUPPORT_HUB', 'Support Hub'),
    ('DG_NOTICEBOARD', 'DG Notice Board'),
    ('MY_SOCIETY', 'My Society'),
    ('DOCUMENTS', 'Document Management'),
    ('MOVE_IN', 'Move-in Process'),
    ('EXIT', 'Exit Process')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'CREATE_PROPERTY', 'Create and publish properties', m.id FROM "Module" m WHERE m.name = 'PROPERTY'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_PROPERTY', 'View properties and listings', m.id FROM "Module" m WHERE m.name = 'PROPERTY'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'UPDATE_PROPERTY', 'Update property details', m.id FROM "Module" m WHERE m.name = 'PROPERTY'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'DELETE_PROPERTY', 'Remove property listings', m.id FROM "Module" m WHERE m.name = 'PROPERTY'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'REQUEST_VISIT', 'Request property visits', m.id FROM "Module" m WHERE m.name = 'VISIT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'APPROVE_VISIT', 'Approve or reject visit requests', m.id FROM "Module" m WHERE m.name = 'VISIT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'CREATE_AGREEMENT', 'Create rental agreements', m.id FROM "Module" m WHERE m.name = 'AGREEMENT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_AGREEMENT', 'View agreement documents', m.id FROM "Module" m WHERE m.name = 'AGREEMENT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'SUBMIT_KYC', 'Submit KYC documents', m.id FROM "Module" m WHERE m.name = 'KYC'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VERIFY_KYC', 'Verify KYC submissions', m.id FROM "Module" m WHERE m.name = 'KYC'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_KYC_STATUS', 'View KYC verification status', m.id FROM "Module" m WHERE m.name = 'KYC'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'ACCESS_SLAAS', 'Access SLAAS services', m.id FROM "Module" m WHERE m.name = 'SLAAS'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'CREATE_SMART_AGREEMENT', 'Create smart agreements', m.id FROM "Module" m WHERE m.name = 'SMART_AGREEMENT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'SIGN_AGREEMENT', 'Sign digital agreements', m.id FROM "Module" m WHERE m.name = 'SMART_AGREEMENT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'HIRE_EXPERT', 'Hire local experts', m.id FROM "Module" m WHERE m.name = 'LOCAL_EXPERT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_EXPERTS', 'View available experts', m.id FROM "Module" m WHERE m.name = 'LOCAL_EXPERT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'REQUEST_MAINTENANCE', 'Request maintenance services', m.id FROM "Module" m WHERE m.name = 'MAINTENANCE'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'APPROVE_MAINTENANCE', 'Approve maintenance requests', m.id FROM "Module" m WHERE m.name = 'MAINTENANCE'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'ACCESS_PAYMENT_VAULT', 'Access secure payment vault', m.id FROM "Module" m WHERE m.name = 'PAYMENT_VAULT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'MAKE_PAYMENT', 'Make secure payments', m.id FROM "Module" m WHERE m.name = 'PAYMENT_VAULT'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'RAISE_DISPUTE', 'Raise disputes', m.id FROM "Module" m WHERE m.name = 'DISPUTE'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'RESOLVE_DISPUTE', 'Resolve disputes', m.id FROM "Module" m WHERE m.name = 'DISPUTE'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'ACCESS_SUPPORT', 'Access support services', m.id FROM "Module" m WHERE m.name = 'SUPPORT_HUB'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_NOTICES', 'View notice board', m.id FROM "Module" m WHERE m.name = 'DG_NOTICEBOARD'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'POST_NOTICE', 'Post notices', m.id FROM "Module" m WHERE m.name = 'DG_NOTICEBOARD'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'MANAGE_SOCIETY', 'Manage society settings', m.id FROM "Module" m WHERE m.name = 'MY_SOCIETY'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_SOCIETY_MEMBERS', 'View society members', m.id FROM "Module" m WHERE m.name = 'MY_SOCIETY'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'UPLOAD_DOCUMENT', 'Upload documents', m.id FROM "Module" m WHERE m.name = 'DOCUMENTS'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'VIEW_DOCUMENTS', 'View stored documents', m.id FROM "Module" m WHERE m.name = 'DOCUMENTS'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'INITIATE_MOVE_IN', 'Initiate move-in process', m.id FROM "Module" m WHERE m.name = 'MOVE_IN'
ON CONFLICT (name) DO NOTHING;
INSERT INTO "Feature" (name, description, "moduleId")
SELECT 'INITIATE_EXIT', 'Initiate exit process', m.id FROM "Module" m WHERE m.name = 'EXIT'
ON CONFLICT (name) DO NOTHING;

INSERT INTO "Subscription" (name, description)
VALUES
    ('FREE', 'Basic access to public features'),
    ('PRO', 'Access to advanced features and modules')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'PLATFORM_ADMIN', f.id FROM "Feature" f
ON CONFLICT DO NOTHING;
INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'TENANT', f.id FROM "Feature" f WHERE f.name IN ('VIEW_PROPERTY','REQUEST_VISIT','VIEW_AGREEMENT','SUBMIT_KYC','VIEW_KYC_STATUS','ACCESS_SLAAS','SIGN_AGREEMENT','HIRE_EXPERT','VIEW_EXPERTS','REQUEST_MAINTENANCE','ACCESS_PAYMENT_VAULT','MAKE_PAYMENT','RAISE_DISPUTE','ACCESS_SUPPORT','VIEW_NOTICES','VIEW_SOCIETY_MEMBERS','VIEW_DOCUMENTS','INITIATE_MOVE_IN','INITIATE_EXIT')
ON CONFLICT DO NOTHING;
INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'LANDLORD', f.id FROM "Feature" f WHERE f.name IN ('CREATE_PROPERTY','VIEW_PROPERTY','UPDATE_PROPERTY','DELETE_PROPERTY','APPROVE_VISIT','CREATE_AGREEMENT','VIEW_AGREEMENT','VERIFY_KYC','CREATE_SMART_AGREEMENT','APPROVE_MAINTENANCE','ACCESS_PAYMENT_VAULT','RESOLVE_DISPUTE','POST_NOTICE','MANAGE_SOCIETY','VIEW_SOCIETY_MEMBERS','UPLOAD_DOCUMENT','VIEW_DOCUMENTS')
ON CONFLICT DO NOTHING;
INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'SERVICE_PROVIDER', f.id FROM "Feature" f WHERE f.name IN ('VIEW_EXPERTS','APPROVE_MAINTENANCE','ACCESS_SUPPORT')
ON CONFLICT DO NOTHING;
INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'SOCIETY_ADMIN', f.id FROM "Feature" f WHERE f.name IN ('POST_NOTICE','MANAGE_SOCIETY','VIEW_SOCIETY_MEMBERS','UPLOAD_DOCUMENT','VIEW_DOCUMENTS')
ON CONFLICT DO NOTHING;
INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'SUPPORT_AGENT', f.id FROM "Feature" f WHERE f.name IN ('VERIFY_KYC','RESOLVE_DISPUTE','ACCESS_SUPPORT','VIEW_DOCUMENTS')
ON CONFLICT DO NOTHING;

INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'LANDLORD', f.id FROM "Feature" f WHERE f.name IN ('CREATE_PROPERTY','VIEW_PROPERTY','UPDATE_PROPERTY','DELETE_PROPERTY','APPROVE_VISIT')
ON CONFLICT DO NOTHING;

INSERT INTO "RoleFeature" (role, "featureId")
SELECT 'TENANT', f.id FROM "Feature" f WHERE f.name IN ('VIEW_PROPERTY','REQUEST_VISIT','VIEW_AGREEMENT')
ON CONFLICT DO NOTHING;

INSERT INTO "SubscriptionFeature" ("subscriptionId", "featureId")
SELECT s.id, f.id FROM "Subscription" s, "Feature" f
WHERE s.name = 'FREE' AND f.name IN ('VIEW_PROPERTY','REQUEST_VISIT')
ON CONFLICT DO NOTHING;

INSERT INTO "SubscriptionFeature" ("subscriptionId", "featureId")
SELECT s.id, f.id FROM "Subscription" s, "Feature" f
WHERE s.name = 'PRO' AND f.name IN ('CREATE_PROPERTY','VIEW_PROPERTY','UPDATE_PROPERTY','DELETE_PROPERTY','REQUEST_VISIT','APPROVE_VISIT','CREATE_AGREEMENT','VIEW_AGREEMENT')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "Property" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    price INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms DECIMAL NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);