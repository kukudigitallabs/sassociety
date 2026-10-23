-- ============================================================================
-- SocietyOS Multi-Tenant SaaS Platform — Hostinger MySQL 8.0 / MariaDB Schema
-- Import this file directly in Hostinger hPanel -> phpMyAdmin -> Import tab
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- --------------------------------------------------------
-- Table structure for table `platform_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(64) NOT NULL,
  `platform_name` TEXT NOT NULL,
  `support_email` TEXT NOT NULL,
  `support_phone` TEXT NOT NULL,
  `default_trial_enabled` INT NOT NULL DEFAULT 1,
  `default_trial_days` INT NOT NULL DEFAULT 14,
  `default_grace_period_days` INT NOT NULL DEFAULT 7,
  `auto_approve_paid_societies` INT NOT NULL DEFAULT 1,
  `auto_approve_trial_societies` INT NOT NULL DEFAULT 1,
  `reminder_days_before_expiry` INT NOT NULL DEFAULT 5,
  `razorpay_key_id` VARCHAR(64) NOT NULL DEFAULT 'rzp_test_platform_demo_key',
  `razorpay_sandbox_mode` INT NOT NULL DEFAULT 1,
  `welcome_email_template` LONGTEXT NOT NULL,
  `invoice_email_template` LONGTEXT NOT NULL,
  `overdue_email_template` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  `razorpay_key_secret_encrypted` TEXT NULL,
  `razorpay_webhook_secret_encrypted` TEXT NULL,
  `paytm_merchant_id` VARCHAR(64) NULL,
  `paytm_merchant_key_encrypted` TEXT NULL,
  `custom_gateway_name` TEXT NULL,
  `custom_gateway_api_key` TEXT NULL,
  `custom_gateway_secret_encrypted` TEXT NULL,
  `upi_id` VARCHAR(64) NULL,
  `upi_payee_name` TEXT NULL,
  `bank_name` TEXT NULL,
  `bank_account_number` TEXT NULL,
  `bank_ifsc` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `platform_settings`
INSERT IGNORE INTO `platform_settings` (`id`, `platform_name`, `support_email`, `support_phone`, `default_trial_enabled`, `default_trial_days`, `default_grace_period_days`, `auto_approve_paid_societies`, `auto_approve_trial_societies`, `reminder_days_before_expiry`, `razorpay_key_id`, `razorpay_sandbox_mode`, `welcome_email_template`, `invoice_email_template`, `overdue_email_template`, `updated_at`, `razorpay_key_secret_encrypted`, `razorpay_webhook_secret_encrypted`, `paytm_merchant_id`, `paytm_merchant_key_encrypted`, `custom_gateway_name`, `custom_gateway_api_key`, `custom_gateway_secret_encrypted`, `upi_id`, `upi_payee_name`, `bank_name`, `bank_account_number`, `bank_ifsc`) VALUES ('default', 'SocietyOS Enterprise SaaS', 'superadmin@societyos.com', '+91-98765-00001', 1, 14, 7, 1, 1, 5, 'rzp_test_TpIGmZQJ7x3t3P', 1, 'Welcome to SocietyOS! Your society account is ready.', 'A new society bill has been generated for your household.', 'Reminder: Your society maintenance payment is overdue.', '2026-10-21 11:02:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `password_hash` TEXT NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `society_id` VARCHAR(64) NULL,
  `is_active` INT NOT NULL DEFAULT 1,
  `email_verified` INT NOT NULL DEFAULT 1,
  `reset_token_hash` TEXT NULL,
  `reset_token_expires_at` VARCHAR(64) NULL,
  `last_login_at` VARCHAR(64) NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_users_society_id` (`society_id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `users`
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('94e7a8da-927d-49da-b02f-f6e661a7c790', 'kukuhomes@gmail.com', '66557788', '223121695f2be3f2ef19f06d9d9adf14:5fd237b14803fce2de80ed0614bffa27930b14fcd4412a93ba9a8374a98eb049f2f5e794f46bb71372f47ea65cba69e67c2a4c3cba4e836694a0d64957edaf01', 'SOCIETY_ADMIN', '481217da-9f91-4d17-86a6-dc4f17725a75', 1, 1, NULL, NULL, NULL, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-admin-green-valley', 'admin@greenvalley.com', '+91-98150-11223', 'f28f77d07e8a424838b97eb0e684031f:82f76e1cbfca51280c80726a98d23e3c9fd83afab8bb865b10337cb4e982acd8a8a96e4a1483fd560be02991591bce803021381e4602a247d9cf9dcbe5cf04df', 'SOCIETY_ADMIN', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-23 11:00:33', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-admin-royal-palms', 'admin@royalpalms.com', '+91-98720-44556', '5d072983429d1c6fa59a2e9997d8f5dc:d7cea660488a2a8676d5b651596e47635a4011903625280ddbe0c130e4d2b70170d630784566f8a43328d6ffaad94eb541fb4567ea287ad93fcbe8bb895a72de', 'SOCIETY_ADMIN', 'soc-royal-palms', 1, 1, NULL, NULL, '2026-10-23 10:58:07', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-a101', 'resident@greenvalley.com', '+91-98151-10101', '44106704647001abad6340bc1b1d61ec:a055a8d1c9a69eca584bc35cb6ad20d8529a2810fe4bde29d280136fc78c0996cb41bb117cf6b4495bf7de8521115c74ab994fad222b7be722e583fa9b2d2635', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-23 10:57:53', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-a102', 'simran@greenvalley.com', '+91-98151-10102', '39b4dae9e2b6dd2888c19aa0416ee627:f7090043242b137b5d2b4e7a147a139cf6a3733fbf736ab24998dc02b1d592283f82250b87b59c60adf11d99351a84559bf41bf185109c71fd895082315a8aa6', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-b201', 'rajesh@greenvalley.com', '+91-98151-20101', '1ca00589183ac7fd9d9a3350ae9cb11d:f34133c0ed56936ac9a70ba0b426dbd098d0db0cf30a851ecdc14111999fa216d58eda981db8b8d091dcf2901798dc8dff6278ab1f5a01a1178469fa8b5ac967', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-rpe-a101', 'resident@royalpalms.com', '+91-98720-10101', '0a62fa9e37b00b3ec8ed87728c88de55:50c8689fec3108c6c1a65efd39fcc773e8369d29258d88b671545643cea586e9750ef1c0cc9135a7d57c1292954276d8ff5e94698b4cede726f939bcc7fbd57d', 'MEMBER', 'soc-royal-palms', 1, 1, NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-staff-cashier-gvr', 'cashier@greenvalley.com', '+91-98152-33445', 'ea3d438821d6b75c9fb2b00bebc876aa:24e5e9fa37702d2d67eb1b1224e80f055ddefa1288e02531bd6e39773eef16c907fed1bc45c1d7ca0469f34a07949bd19c4d0aefea9d7cab59e8fc8fe67ff2d9', 'STAFF', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-23 10:58:04', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-super-admin', 'superadmin@societyos.com', '+91-98765-00001', '225e063f1311b3b121281d35819d2661:a20805c9943dc4b925d16c86f6e3d34f14f5e7203d1d7c7a18fdaa7c503d50b5f755f6d171d05dc17800eac541b037bd2d792c957f9d9ef700bf383c1aa26df9', 'SUPER_ADMIN', NULL, 1, 1, NULL, NULL, '2026-10-23 10:58:09', '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `user_profiles`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `avatar_url` LONGTEXT NULL,
  `preferred_language` TEXT NOT NULL,
  `address` TEXT NULL,
  `emergency_contact_name` TEXT NULL,
  `emergency_contact_phone` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_profiles_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `user_profiles`
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('058bceee-39dd-44f7-bee0-c03705e954b7', 'user-staff-cashier-gvr', 'soc-green-valley', 'Balwinder Singh (Cashier)', NULL, 'en', NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('09becd99-424e-4b3b-8484-cd218826e3cf', 'user-member-rpe-a101', 'soc-royal-palms', 'Amanpreet Singh Grewal', NULL, 'en', 'Flat A-101, Royal Palms Enclave', NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('1a725af3-6eb8-4aca-a6c8-e934115bbaf6', '94e7a8da-927d-49da-b02f-f6e661a7c790', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Karamjit Kuku', NULL, 'en', 'phase 6', NULL, NULL, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('22ba70d1-6a8a-43eb-baea-09db5aecd211', 'user-admin-green-valley', 'soc-green-valley', 'Harpreet Singh Gill (RWA President)', NULL, 'en', NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('2a7dcd71-dc8f-4980-a2d7-bbd1f70ef30d', 'user-member-b201', 'soc-green-valley', 'Rajesh Kumar Sharma', NULL, 'en', 'Flat B-201, Block B, Green Valley Residency', 'Anita Sharma', '+91-98151-99993', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('3db15af3-c4f5-4682-b430-78d739ce651a', 'user-admin-royal-palms', 'soc-royal-palms', 'Gurप्रीत Kaur Sandhu (Secretary)', NULL, 'en', NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('53557728-c4b7-4077-a430-cc275bac6358', 'user-super-admin', NULL, 'Platform Owner (Super Admin)', NULL, 'en', NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('a2b3d7e8-90e7-43cd-b318-397bd0b7c1c3', 'user-member-a101', 'soc-green-valley', 'Manpreet Singh Brar', NULL, 'en', 'Flat A-101, Block A, Green Valley Residency', 'Kuldeep Kaur', '+91-98151-99991', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('dbbceff0-684d-4b3d-92bb-bc4c788d34a5', 'user-member-a102', 'soc-green-valley', 'Simranjit Kaur Dhillon', NULL, 'pa', 'Flat A-102, Block A, Green Valley Residency', 'Navjot Singh', '+91-98151-99992', '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `subscription_plans`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `billing_period` TEXT NOT NULL,
  `duration_days` INT NOT NULL,
  `price_amount` DECIMAL(14,2) NOT NULL,
  `tax_percent` DECIMAL(14,2) NOT NULL DEFAULT 18.0,
  `max_households` INT NOT NULL DEFAULT 500,
  `trial_enabled` INT NOT NULL DEFAULT 1,
  `trial_days` INT NOT NULL DEFAULT 14,
  `grace_period_days` INT NOT NULL DEFAULT 7,
  `auto_approve_after_payment` INT NOT NULL DEFAULT 1,
  `is_active` INT NOT NULL DEFAULT 1,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subscription_plans_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `subscription_plans`
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`) VALUES ('plan-annual-enterprise', 'ANNUAL_ENTERPRISE', 'Enterprise Annual RWA Suite', 'Full multi-block suite with unlimited reports, priority support & up to 1000 flats.', 'ANNUAL', 365, 19999, 18, 1000, 1, 14, 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`) VALUES ('plan-monthly-standard', 'MONTHLY_STARTER', 'Starter Monthly Plan', 'Ideal for small societies and apartments up to 100 flats.', 'MONTHLY', 30, 1999, 18, 100, 1, 14, 7, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`) VALUES ('plan-quarterly-growth', 'QUARTERLY_GROWTH', 'Growth Quarterly Plan', 'Complete billing, accounting, and staff portal for up to 300 flats.', 'QUARTERLY', 90, 5499, 18, 300, 1, 14, 7, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `societies`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `societies` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `enrollment_code` VARCHAR(191) NOT NULL,
  `logo_url` LONGTEXT NULL,
  `address` TEXT NOT NULL,
  `city` TEXT NOT NULL,
  `state` TEXT NOT NULL,
  `pincode` TEXT NOT NULL,
  `contact_email` VARCHAR(255) NOT NULL,
  `contact_phone` VARCHAR(255) NOT NULL,
  `registration_number` TEXT NULL,
  `admin_user_id` VARCHAR(64) NULL,
  `subscription_plan_id` VARCHAR(64) NULL,
  `subscription_status` TEXT NOT NULL,
  `approval_status` TEXT NOT NULL,
  `account_status` TEXT NOT NULL,
  `payment_status` TEXT NOT NULL,
  `trial_starts_at` VARCHAR(64) NULL,
  `trial_ends_at` VARCHAR(64) NULL,
  `subscription_starts_at` VARCHAR(64) NULL,
  `subscription_ends_at` VARCHAR(64) NULL,
  `grace_period_ends_at` VARCHAR(64) NULL,
  `is_demo` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_societies_slug` (`slug`),
  UNIQUE KEY `uk_societies_enrollment_code` (`enrollment_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `societies`
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('481217da-9f91-4d17-86a6-dc4f17725a75', 'kuku homes', 'kuku-homes-481217', 'KUKU-5042', NULL, 'phase 6', 'Mohali', 'Punjab', '160062', 'kukuhomes@gmail.com', '66557788', '9900', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'plan-monthly-standard', 'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID', NULL, NULL, '2026-10-21T21:38:36.765Z', '2026-11-20T21:38:36.765Z', '2026-11-27T21:38:36.765Z', 0, '2026-10-21 21:38:32', '2026-10-21 21:38:36');
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('soc-green-valley', 'Green Valley Residency (Demo)', 'green-valley-residency', 'GVR-2026', NULL, 'Sector 68, Airport Road, Mohali', 'Mohali', 'Punjab', '160062', 'admin@greenvalley.com', '+91-98150-11223', 'PB-MOH-RWA-2021-089', 'user-admin-green-valley', 'plan-annual-enterprise', 'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID', NULL, NULL, '2026-09-21 11:02:37', '2027-09-21 11:02:37', NULL, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('soc-royal-palms', 'Royal Palms Enclave (Demo)', 'royal-palms-enclave', 'RPE-2026', NULL, 'Pakhowal Road, Civil Lines, Ludhiana', 'Ludhiana', 'Punjab', '141001', 'admin@royalpalms.com', '+91-98720-44556', 'PB-LDH-RWA-2024-112', 'user-admin-royal-palms', 'plan-quarterly-growth', 'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID', '2026-10-18 11:02:37', '2026-11-01 11:02:37', '2026-10-21T21:37:28.538Z', '2027-01-19T21:37:28.538Z', '2027-01-26T21:37:28.538Z', 1, '2026-10-21 11:02:37', '2026-10-21 21:37:28');

-- --------------------------------------------------------
-- Table structure for table `society_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `society_settings` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `upi_enabled` INT NOT NULL DEFAULT 1,
  `gpay_upi_enabled` INT NOT NULL DEFAULT 1,
  `paytm_enabled` INT NOT NULL DEFAULT 1,
  `razorpay_enabled` INT NOT NULL DEFAULT 1,
  `bank_transfer_enabled` INT NOT NULL DEFAULT 1,
  `upi_id` VARCHAR(64) NULL,
  `upi_payee_name` TEXT NULL,
  `upi_qr_url` LONGTEXT NULL,
  `bank_name` TEXT NULL,
  `bank_account_number` TEXT NULL,
  `bank_ifsc` TEXT NULL,
  `razorpay_key_id` VARCHAR(64) NULL,
  `razorpay_key_secret_encrypted` TEXT NULL,
  `bill_due_day` INT NOT NULL DEFAULT 10,
  `late_fee_amount` DECIMAL(14,2) NOT NULL DEFAULT 100.0,
  `allow_member_staff_contacts` INT NOT NULL DEFAULT 1,
  `custom_enrollment_fields` LONGTEXT NOT NULL,
  `email_notifications_enabled` INT NOT NULL DEFAULT 1,
  `sms_notifications_enabled` INT NOT NULL DEFAULT 0,
  `whatsapp_notifications_enabled` INT NOT NULL DEFAULT 0,
  `brand_primary_color` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  `razorpay_webhook_secret_encrypted` TEXT NULL,
  `paytm_merchant_id` VARCHAR(64) NULL,
  `paytm_merchant_key_encrypted` TEXT NULL,
  `custom_gateway_name` TEXT NULL,
  `custom_gateway_api_key` TEXT NULL,
  `custom_gateway_secret_encrypted` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_society_settings_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `society_settings`
INSERT IGNORE INTO `society_settings` (`id`, `society_id`, `upi_enabled`, `gpay_upi_enabled`, `paytm_enabled`, `razorpay_enabled`, `bank_transfer_enabled`, `upi_id`, `upi_payee_name`, `upi_qr_url`, `bank_name`, `bank_account_number`, `bank_ifsc`, `razorpay_key_id`, `razorpay_key_secret_encrypted`, `bill_due_day`, `late_fee_amount`, `allow_member_staff_contacts`, `custom_enrollment_fields`, `email_notifications_enabled`, `sms_notifications_enabled`, `whatsapp_notifications_enabled`, `brand_primary_color`, `created_at`, `updated_at`, `razorpay_webhook_secret_encrypted`, `paytm_merchant_id`, `paytm_merchant_key_encrypted`, `custom_gateway_name`, `custom_gateway_api_key`, `custom_gateway_secret_encrypted`) VALUES ('1c361c42-52af-41d8-be67-4ca689805473', '481217da-9f91-4d17-86a6-dc4f17725a75', 1, 1, 1, 1, 1, 'kukuhomes@hdfcbank', 'kuku homes RWA', NULL, 'HDFC Bank Ltd', '50200089412210', 'HDFC0001245', NULL, NULL, 10, 150, 1, '[]', 1, 0, 0, '#0f766e', '2026-10-21 21:38:32', '2026-10-21 21:38:32', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT IGNORE INTO `society_settings` (`id`, `society_id`, `upi_enabled`, `gpay_upi_enabled`, `paytm_enabled`, `razorpay_enabled`, `bank_transfer_enabled`, `upi_id`, `upi_payee_name`, `upi_qr_url`, `bank_name`, `bank_account_number`, `bank_ifsc`, `razorpay_key_id`, `razorpay_key_secret_encrypted`, `bill_due_day`, `late_fee_amount`, `allow_member_staff_contacts`, `custom_enrollment_fields`, `email_notifications_enabled`, `sms_notifications_enabled`, `whatsapp_notifications_enabled`, `brand_primary_color`, `created_at`, `updated_at`, `razorpay_webhook_secret_encrypted`, `paytm_merchant_id`, `paytm_merchant_key_encrypted`, `custom_gateway_name`, `custom_gateway_api_key`, `custom_gateway_secret_encrypted`) VALUES ('a6d53532-edba-4c7b-b214-95e8744635eb', 'soc-green-valley', 1, 1, 1, 1, 1, 'greenvalleyres@hdfcbank', 'Green Valley Residency RWA', NULL, 'HDFC Bank Ltd', '50200089412210', 'HDFC0001245', NULL, NULL, 10, 150, 1, '[]', 1, 0, 0, '#0f766e', '2026-10-21 11:02:37', '2026-10-21 11:02:37', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT IGNORE INTO `society_settings` (`id`, `society_id`, `upi_enabled`, `gpay_upi_enabled`, `paytm_enabled`, `razorpay_enabled`, `bank_transfer_enabled`, `upi_id`, `upi_payee_name`, `upi_qr_url`, `bank_name`, `bank_account_number`, `bank_ifsc`, `razorpay_key_id`, `razorpay_key_secret_encrypted`, `bill_due_day`, `late_fee_amount`, `allow_member_staff_contacts`, `custom_enrollment_fields`, `email_notifications_enabled`, `sms_notifications_enabled`, `whatsapp_notifications_enabled`, `brand_primary_color`, `created_at`, `updated_at`, `razorpay_webhook_secret_encrypted`, `paytm_merchant_id`, `paytm_merchant_key_encrypted`, `custom_gateway_name`, `custom_gateway_api_key`, `custom_gateway_secret_encrypted`) VALUES ('a7caf06e-9822-40ec-ba9f-783c58efbaad', 'soc-royal-palms', 1, 1, 1, 1, 1, 'royalpalmsencl@hdfcbank', 'Royal Palms Enclave RWA', NULL, 'HDFC Bank Ltd', '50200089412210', 'HDFC0001245', NULL, NULL, 10, 150, 1, '[]', 1, 0, 0, '#0f766e', '2026-10-21 11:02:37', '2026-10-21 11:02:37', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------
-- Table structure for table `society_subscriptions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `society_subscriptions` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `plan_id` VARCHAR(64) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `starts_at` VARCHAR(64) NOT NULL,
  `ends_at` VARCHAR(64) NOT NULL,
  `is_trial` INT NOT NULL DEFAULT 0,
  `extended_reason` TEXT NULL,
  `extended_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_society_subscriptions_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `society_subscriptions`
INSERT IGNORE INTO `society_subscriptions` (`id`, `society_id`, `plan_id`, `status`, `starts_at`, `ends_at`, `is_trial`, `extended_reason`, `extended_by`, `created_at`, `updated_at`) VALUES ('8843f54e-5255-440c-a1df-8d6f0e095883', '481217da-9f91-4d17-86a6-dc4f17725a75', 'plan-monthly-standard', 'ACTIVE', '2026-10-21T21:38:36.765Z', '2026-11-20T21:38:36.765Z', 0, NULL, NULL, '2026-10-21 21:38:36', '2026-10-21 21:38:36');
INSERT IGNORE INTO `society_subscriptions` (`id`, `society_id`, `plan_id`, `status`, `starts_at`, `ends_at`, `is_trial`, `extended_reason`, `extended_by`, `created_at`, `updated_at`) VALUES ('b5871968-8172-4d67-b95a-0e61850f1d9a', 'soc-green-valley', 'plan-annual-enterprise', 'ACTIVE', '2026-09-21 11:02:37', '2027-09-21 11:02:37', 0, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_subscriptions` (`id`, `society_id`, `plan_id`, `status`, `starts_at`, `ends_at`, `is_trial`, `extended_reason`, `extended_by`, `created_at`, `updated_at`) VALUES ('c32fcc23-5bb1-49dc-be20-3aef15d210d4', 'soc-royal-palms', 'plan-quarterly-growth', 'ACTIVE', '2026-10-21T21:37:28.538Z', '2027-01-19T21:37:28.538Z', 0, NULL, NULL, '2026-10-21 21:37:28', '2026-10-21 21:37:28');
INSERT IGNORE INTO `society_subscriptions` (`id`, `society_id`, `plan_id`, `status`, `starts_at`, `ends_at`, `is_trial`, `extended_reason`, `extended_by`, `created_at`, `updated_at`) VALUES ('d2e50314-ceb0-48d6-a5c4-c7cbe4ae42a7', 'soc-royal-palms', 'plan-quarterly-growth', 'TRIAL', '2026-10-18 11:02:37', '2026-11-01 11:02:37', 1, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_subscriptions` (`id`, `society_id`, `plan_id`, `status`, `starts_at`, `ends_at`, `is_trial`, `extended_reason`, `extended_by`, `created_at`, `updated_at`) VALUES ('e100bac9-9ebc-4a74-8373-bf2bb7335d35', '481217da-9f91-4d17-86a6-dc4f17725a75', 'plan-monthly-standard', 'PENDING_PAYMENT', '2026-10-21T21:38:32.213Z', '2026-11-20T21:38:32.271Z', 0, NULL, NULL, '2026-10-21 21:38:32', '2026-10-21 21:38:32');

-- --------------------------------------------------------
-- Table structure for table `subscription_payments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscription_payments` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `subscription_id` VARCHAR(64) NULL,
  `plan_id` VARCHAR(64) NOT NULL,
  `invoice_number` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(14,2) NOT NULL,
  `payment_gateway` TEXT NOT NULL,
  `gateway_order_id` VARCHAR(64) NULL,
  `gateway_payment_id` VARCHAR(64) NULL,
  `gateway_signature` TEXT NULL,
  `verified_by_webhook` INT NOT NULL DEFAULT 0,
  `verified_by_user_id` VARCHAR(64) NULL,
  `status` VARCHAR(191) NOT NULL,
  `refund_reason` TEXT NULL,
  `paid_at` VARCHAR(64) NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_subscription_payments_society_id` (`society_id`),
  UNIQUE KEY `uk_subscription_payments_invoice` (`invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `subscription_payments`
INSERT IGNORE INTO `subscription_payments` (`id`, `society_id`, `subscription_id`, `plan_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `payment_gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `verified_by_webhook`, `verified_by_user_id`, `status`, `refund_reason`, `paid_at`, `created_at`) VALUES ('2ebdc2cb-0ecf-47c5-87d6-292ad618e063', 'soc-royal-palms', NULL, 'plan-quarterly-growth', 'SUB-INV-2026-18349', 5499, 989.82, 6488.82, 'RAZORPAY', 'order_da6404f4434049', 'pay_ba6aa49ef4104c', '4604f3a483192ea697c4a359b75764c0d174b16b75923808c07a502c737ffc6a', 1, NULL, 'PAID', NULL, '2026-10-21T21:37:28.538Z', '2026-10-21 21:37:26');
INSERT IGNORE INTO `subscription_payments` (`id`, `society_id`, `subscription_id`, `plan_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `payment_gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `verified_by_webhook`, `verified_by_user_id`, `status`, `refund_reason`, `paid_at`, `created_at`) VALUES ('36638e2f-a9c5-479f-be3f-5e9e6e54df17', '481217da-9f91-4d17-86a6-dc4f17725a75', 'e100bac9-9ebc-4a74-8373-bf2bb7335d35', 'plan-monthly-standard', 'SUB-INV-2026-73469', 1999, 359.82, 2358.82, 'RAZORPAY', 'order_80dc6ab0c6424e', 'pay_0cfcfff7ad4f46', 'b0ff5113503803e86114d401ae3cf6f44e7eb5a5158c4a51bdede3975a2024bf', 1, NULL, 'PAID', NULL, '2026-10-21T21:38:36.765Z', '2026-10-21 21:38:32');
INSERT IGNORE INTO `subscription_payments` (`id`, `society_id`, `subscription_id`, `plan_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `payment_gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `verified_by_webhook`, `verified_by_user_id`, `status`, `refund_reason`, `paid_at`, `created_at`) VALUES ('6a8883a9-0ff8-4bb7-853f-63af6b693d84', 'soc-green-valley', 'b5871968-8172-4d67-b95a-0e61850f1d9a', 'plan-annual-enterprise', 'SUB-INV-2026-0001', 19999, 3599.82, 23598.82, 'RAZORPAY', 'order_demo_gvr_01', 'pay_demo_gvr_01', NULL, 1, NULL, 'PAID', NULL, '2026-09-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `apartment_blocks`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `apartment_blocks` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `total_floors` INT NOT NULL DEFAULT 10,
  `description` LONGTEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_apartment_blocks_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `apartment_blocks`
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('094a451b-15da-4617-8f7e-e6d451bede90', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Block C', 10, 'Residential Block C', '2026-10-21 21:38:32');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('415a3622-e139-4c88-a383-2bdd4e4f6701', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Block B', 10, 'Residential Block B', '2026-10-21 21:38:32');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('47d72de8-da7d-475a-a0a4-c9dba01ea7fc', 'soc-royal-palms', 'Block C', 10, 'Residential Block C', '2026-10-21 11:02:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('4fff9a80-8f7c-4cb7-a326-3cede007842e', 'soc-royal-palms', 'Block A', 10, 'Residential Block A', '2026-10-21 11:02:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('6e759a18-7854-455b-ab7c-0df024d764e0', 'soc-royal-palms', 'Block B', 10, 'Residential Block B', '2026-10-21 11:02:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('74f42249-896a-4b5f-8156-cc3cb6c93b9c', 'soc-green-valley', 'Block A', 10, 'Residential Block A', '2026-10-21 11:02:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('76e34274-8e24-4cdf-9b2f-9ea56df08aff', 'soc-green-valley', 'Block C', 10, 'Residential Block C', '2026-10-21 11:02:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('89624937-e1df-4d25-a3a2-1432030501c2', 'soc-green-valley', 'Tower D', 10, '', '2026-10-21 21:33:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('f47815a9-8afe-4c6e-a414-da1d412ea698', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Block A', 10, 'Residential Block A', '2026-10-21 21:38:32');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('fcb45f99-ed3a-4505-a2b4-2b7a5a28150a', 'soc-green-valley', 'Block B', 10, 'Residential Block B', '2026-10-21 11:02:37');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('9e75fd1e-1bff-4a91-8d76-bf0be7c8edc2', 'soc-green-valley', 'D', 10, '', '2026-10-23 11:00:40');

-- --------------------------------------------------------
-- Table structure for table `households`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `households` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `block_id` VARCHAR(64) NULL,
  `block_name` VARCHAR(191) NOT NULL DEFAULT 'A',
  `floor_number` TEXT NOT NULL,
  `flat_number` VARCHAR(191) NOT NULL,
  `normalized_flat_number` VARCHAR(191) NOT NULL,
  `occupancy_type` TEXT NOT NULL,
  `area_sqft` DECIMAL(14,2) NOT NULL DEFAULT 1200,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `primary_member_id` VARCHAR(64) NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  `opening_balance` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `opening_balance_notes` TEXT NULL,
  `opening_balance_date` VARCHAR(64) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_households_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `households`
INSERT IGNORE INTO `households` (`id`, `society_id`, `block_id`, `block_name`, `floor_number`, `flat_number`, `normalized_flat_number`, `occupancy_type`, `area_sqft`, `status`, `primary_member_id`, `created_at`, `updated_at`, `opening_balance`, `opening_balance_notes`, `opening_balance_date`) VALUES ('hh-gvr-a101', 'soc-green-valley', '74f42249-896a-4b5f-8156-cc3cb6c93b9c', 'Block A', '1', 'A-101', 'A-101', 'OWNER', 1450, 'ACTIVE', 'member-gvr-a101', '2026-10-21 11:02:37', '2026-10-21 11:02:37', 0, NULL, NULL);
INSERT IGNORE INTO `households` (`id`, `society_id`, `block_id`, `block_name`, `floor_number`, `flat_number`, `normalized_flat_number`, `occupancy_type`, `area_sqft`, `status`, `primary_member_id`, `created_at`, `updated_at`, `opening_balance`, `opening_balance_notes`, `opening_balance_date`) VALUES ('hh-gvr-a102', 'soc-green-valley', '74f42249-896a-4b5f-8156-cc3cb6c93b9c', 'Block A', '1', 'A-102', 'A-102', 'TENANT', 1450, 'ACTIVE', 'member-gvr-a102', '2026-10-21 11:02:37', '2026-10-21 11:02:37', 0, NULL, NULL);
INSERT IGNORE INTO `households` (`id`, `society_id`, `block_id`, `block_name`, `floor_number`, `flat_number`, `normalized_flat_number`, `occupancy_type`, `area_sqft`, `status`, `primary_member_id`, `created_at`, `updated_at`, `opening_balance`, `opening_balance_notes`, `opening_balance_date`) VALUES ('hh-gvr-b201', 'soc-green-valley', 'fcb45f99-ed3a-4505-a2b4-2b7a5a28150a', 'Block B', '2', 'B-201', 'B-201', 'OWNER', 1650, 'ACTIVE', 'member-gvr-b201', '2026-10-21 11:02:37', '2026-10-21 11:02:37', 0, NULL, NULL);
INSERT IGNORE INTO `households` (`id`, `society_id`, `block_id`, `block_name`, `floor_number`, `flat_number`, `normalized_flat_number`, `occupancy_type`, `area_sqft`, `status`, `primary_member_id`, `created_at`, `updated_at`, `opening_balance`, `opening_balance_notes`, `opening_balance_date`) VALUES ('hh-rpe-a101', 'soc-royal-palms', '4fff9a80-8f7c-4cb7-a326-3cede007842e', 'Block A', '1', 'A-101', 'A-101', 'OWNER', 1800, 'ACTIVE', 'member-rpe-a101', '2026-10-21 11:02:37', '2026-10-21 11:02:37', 0, NULL, NULL);

-- --------------------------------------------------------
-- Table structure for table `society_members`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `society_members` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `household_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `photo_url` LONGTEXT NULL,
  `relationship_to_primary` TEXT NOT NULL,
  `is_primary_member` INT NOT NULL DEFAULT 1,
  `ownership_type` TEXT NOT NULL,
  `emergency_contact` TEXT NULL,
  `custom_fields` LONGTEXT NOT NULL,
  `approval_status` TEXT NOT NULL,
  `account_status` TEXT NOT NULL,
  `joined_at` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_society_members_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `society_members`
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('member-gvr-a101', 'soc-green-valley', 'hh-gvr-a101', 'user-member-a101', 'Manpreet Singh Brar', 'resident@greenvalley.com', '+91-98151-10101', NULL, 'PRIMARY', 1, 'OWNER', 'Kuldeep Kaur (+91-98151-99991)', '{}', 'APPROVED', 'ACTIVE', '2026-10-21 11:02:37', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('member-gvr-a102', 'soc-green-valley', 'hh-gvr-a102', 'user-member-a102', 'Simranjit Kaur Dhillon', 'simran@greenvalley.com', '+91-98151-10102', NULL, 'PRIMARY', 1, 'TENANT', 'Navjot Singh (+91-98151-99992)', '{}', 'APPROVED', 'ACTIVE', '2026-10-21 11:02:37', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('member-gvr-b201', 'soc-green-valley', 'hh-gvr-b201', 'user-member-b201', 'Rajesh Kumar Sharma', 'rajesh@greenvalley.com', '+91-98151-20101', NULL, 'PRIMARY', 1, 'OWNER', 'Anita Sharma (+91-98151-99993)', '{}', 'APPROVED', 'ACTIVE', '2026-10-21 11:02:37', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('member-rpe-a101', 'soc-royal-palms', 'hh-rpe-a101', 'user-member-rpe-a101', 'Amanpreet Singh Grewal', 'resident@royalpalms.com', '+91-98720-10101', NULL, 'PRIMARY', 1, 'OWNER', NULL, '{}', 'APPROVED', 'ACTIVE', '2026-10-21 11:02:37', '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `member_invitations`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `member_invitations` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(255) NULL,
  `flat_number` VARCHAR(191) NULL,
  `expires_at` VARCHAR(64) NOT NULL,
  `used_at` VARCHAR(64) NULL,
  `created_by` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_member_invitations_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `charge_categories`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `charge_categories` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` LONGTEXT NULL,
  `default_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `billing_frequency` TEXT NOT NULL,
  `applicable_flats` TEXT NOT NULL,
  `due_day` INT NOT NULL DEFAULT 10,
  `is_single_charge_per_period` INT NOT NULL DEFAULT 1,
  `is_active` INT NOT NULL DEFAULT 1,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_charge_categories_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `charge_categories`
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('072fda1c-6583-4281-8210-34049411cef6', 'soc-royal-palms', 'Cleaning charges', 'CLEANING_CHARGES', 'Cleaning charges for society households', 250, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('0bdd62b4-3d67-44ba-b020-18bee34c2204', 'soc-green-valley', 'Repair and maintenance', 'REPAIR_MAINTENANCE', 'Repair and maintenance for society households', 350, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('3622be2f-ee66-4e43-9a47-639f249970b2', 'soc-royal-palms', 'Special assessments', 'SPECIAL_ASSESSMENTS', 'Special assessments for society households', 1000, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('364d9c45-7186-475a-92ba-a1ee321b9ab5', 'soc-green-valley', 'Other charges', 'OTHER_CHARGES', 'Other charges for society households', 200, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('41d030d2-1003-4c44-9098-054691d75c3d', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Repair and maintenance', 'REPAIR_MAINTENANCE', 'Repair and maintenance for society households', 350, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('4259a339-b72e-466f-9c84-ca2f73c1fd23', 'soc-royal-palms', 'Other charges', 'OTHER_CHARGES', 'Other charges for society households', 200, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('46336af2-e178-4401-89ed-14efdfaae5fd', 'soc-royal-palms', 'Security charges', 'SECURITY_CHARGES', 'Security charges for society households', 500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('4d8f0db2-1f55-49c5-b13d-8fabbf21285e', 'soc-royal-palms', 'Repair and maintenance', 'REPAIR_MAINTENANCE', 'Repair and maintenance for society households', 350, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('4edf4d06-e8ed-4830-a21c-552b9293d813', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Water charges', 'WATER_CHARGES', 'Water charges for society households', 400, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('4efbf0ef-f992-4046-82ad-4de32f742f58', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Other charges', 'OTHER_CHARGES', 'Other charges for society households', 200, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('668b4507-ac65-4a47-9883-73890fdfd883', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Parking charges', 'PARKING_CHARGES', 'Parking charges for society households', 300, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('6b6dc9da-3021-4382-a16e-780035b8f77e', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Cleaning charges', 'CLEANING_CHARGES', 'Cleaning charges for society households', 250, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('702dd47f-e894-4da4-8630-b05eb5fc06e1', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Electricity charges', 'ELECTRICITY_CHARGES', 'Electricity charges for society households', 600, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('753e4690-bfdf-433b-8ccf-858e027ab86a', 'soc-royal-palms', 'Monthly maintenance', 'MONTHLY_MAINTENANCE', 'Monthly maintenance for society households', 2500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('79d9e1f6-d7c0-4317-a4d4-b13a82e7c4a3', 'soc-green-valley', 'Monthly maintenance', 'MONTHLY_MAINTENANCE', 'Monthly maintenance for society households', 2500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('7b3bb901-8e28-4767-b551-edddff507319', 'soc-royal-palms', 'Water charges', 'WATER_CHARGES', 'Water charges for society households', 400, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('84f9c071-73de-4850-a415-ccf4b585022d', 'soc-green-valley', 'Parking charges', 'PARKING_CHARGES', 'Parking charges for society households', 300, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('88a766f7-a6ae-472d-87dc-9b3da0a64c27', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Late payment fees', 'LATE_PAYMENT_FEES', 'Late payment fees for society households', 150, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('8f9c2a37-0eec-401e-a830-4d5d67833cf2', 'soc-royal-palms', 'Late payment fees', 'LATE_PAYMENT_FEES', 'Late payment fees for society households', 150, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('c96565dd-b558-4e8c-894d-49c92c144ceb', 'soc-green-valley', 'Electricity charges', 'ELECTRICITY_CHARGES', 'Electricity charges for society households', 600, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('ceea987e-50c4-4db5-9273-977c3ecad020', 'soc-green-valley', 'Special assessments', 'SPECIAL_ASSESSMENTS', 'Special assessments for society households', 1000, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('d4351eca-4ec5-440c-85a1-49ab5738fe7a', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Monthly maintenance', 'MONTHLY_MAINTENANCE', 'Monthly maintenance for society households', 2500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('d52477cc-57a0-4eff-9621-6b8cad7f8ae3', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Security charges', 'SECURITY_CHARGES', 'Security charges for society households', 500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('e33b3854-cbfb-4e73-b361-f6b1b6c7984c', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Special assessments', 'SPECIAL_ASSESSMENTS', 'Special assessments for society households', 1000, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 21:38:32', '2026-10-21 21:38:32');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('e5235fd6-a783-4659-b664-946b576944cb', 'soc-green-valley', 'Cleaning charges', 'CLEANING_CHARGES', 'Cleaning charges for society households', 250, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('e587ac30-1940-4b09-b080-129a7cf13289', 'soc-royal-palms', 'Electricity charges', 'ELECTRICITY_CHARGES', 'Electricity charges for society households', 600, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('ed4dd59b-033b-427e-9f6f-c5a720b8b6cd', 'soc-royal-palms', 'Parking charges', 'PARKING_CHARGES', 'Parking charges for society households', 300, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('f5c8651d-0309-4fa1-b11d-65a615914719', 'soc-green-valley', 'Water charges', 'WATER_CHARGES', 'Water charges for society households', 400, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('fa0c8df1-3064-4293-9ff4-d1f914a6a0bd', 'soc-green-valley', 'Late payment fees', 'LATE_PAYMENT_FEES', 'Late payment fees for society households', 150, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('fee95ce4-bcfe-45b1-8b8b-0ddee2340796', 'soc-green-valley', 'Security charges', 'SECURITY_CHARGES', 'Security charges for society households', 500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `member_bills`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `member_bills` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `household_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NULL,
  `bill_number` VARCHAR(191) NOT NULL,
  `billing_month` INT NOT NULL,
  `billing_year` INT NOT NULL,
  `bill_type` TEXT NOT NULL,
  `adjustment_reason` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
  `subtotal_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `previous_balance` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `penalty_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `credit_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `paid_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `balance_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `due_date` VARCHAR(64) NOT NULL,
  `issued_at` VARCHAR(64) NULL,
  `created_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_member_bills_society_id` (`society_id`),
  UNIQUE KEY `uk_member_bills_bill_number` (`bill_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `member_bills`
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('bill-gvr-2026-09-a101', 'soc-green-valley', 'hh-gvr-a101', 'member-gvr-a101', 'GVR-202609-A101', 9, 2026, 'REGULAR', NULL, 'PAID', 3400, 0, 0, 0, 3400, 3400, 0, '2026-09-10', '2026-09-11 11:02:37', 'user-admin-green-valley', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('bill-gvr-2026-10-a101', 'soc-green-valley', 'hh-gvr-a101', 'member-gvr-a101', 'GVR-202610-A101', 10, 2026, 'REGULAR', NULL, 'UNPAID', 3400, 0, 0, 0, 3400, 0, 3400, '2026-10-25', '2026-10-16 11:02:37', 'user-admin-green-valley', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('bill-gvr-2026-10-a102', 'soc-green-valley', 'hh-gvr-a102', 'member-gvr-a102', 'GVR-202610-A102', 10, 2026, 'REGULAR', NULL, 'PENDING_VERIFICATION', 3400, 0, 0, 0, 3400, 0, 3400, '2026-10-25', '2026-10-16 11:02:37', 'user-admin-green-valley', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('bill-gvr-2026-10-b201', 'soc-green-valley', 'hh-gvr-b201', 'member-gvr-b201', 'GVR-202610-B201', 10, 2026, 'REGULAR', NULL, 'PAID', 3400, 0, 0, 0, 3400, 3400, 0, '2026-10-25', '2026-10-16 11:02:37', 'user-admin-green-valley', '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `bill_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bill_items` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `bill_id` VARCHAR(64) NOT NULL,
  `household_id` VARCHAR(64) NOT NULL,
  `charge_category_id` VARCHAR(64) NOT NULL,
  `category_name` TEXT NOT NULL,
  `billing_month` INT NOT NULL,
  `billing_year` INT NOT NULL,
  `description` LONGTEXT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `is_adjustment` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bill_items_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `bill_items`
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('107e4ba3-29ef-434e-8d34-19dd2c8d2670', 'soc-green-valley', 'bill-gvr-2026-09-a101', 'hh-gvr-a101', '79d9e1f6-d7c0-4317-a4d4-b13a82e7c4a3', 'Monthly maintenance', 9, 2026, 'Monthly Maintenance Charges', 2500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('29a360ab-8927-46ba-b846-d97d7d1c3d25', 'soc-green-valley', 'bill-gvr-2026-09-a101', 'hh-gvr-a101', 'f5c8651d-0309-4fa1-b11d-65a615914719', 'Water charges', 9, 2026, 'Water Supply Charges', 400, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('51226f12-2290-49d5-b7ab-3da05d6a1206', 'soc-green-valley', 'bill-gvr-2026-10-a102', 'hh-gvr-a102', 'fee95ce4-bcfe-45b1-8b8b-0ddee2340796', 'Security charges', 10, 2026, '24x7 Security Charges', 500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('58431200-df6f-4f9e-928d-b1924ad4c1a7', 'soc-green-valley', 'bill-gvr-2026-10-a101', 'hh-gvr-a101', 'f5c8651d-0309-4fa1-b11d-65a615914719', 'Water charges', 10, 2026, 'Water Supply Charges', 400, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('5db2e294-219a-463c-a1cf-072e918774be', 'soc-green-valley', 'bill-gvr-2026-10-a101', 'hh-gvr-a101', 'fee95ce4-bcfe-45b1-8b8b-0ddee2340796', 'Security charges', 10, 2026, '24x7 Security Charges', 500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('65b45a9c-4f5f-4391-958e-5dcd239272c1', 'soc-green-valley', 'bill-gvr-2026-10-a102', 'hh-gvr-a102', 'f5c8651d-0309-4fa1-b11d-65a615914719', 'Water charges', 10, 2026, 'Water Supply Charges', 400, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('75b54a22-8cc9-4ea6-ab47-b9531769f6c0', 'soc-green-valley', 'bill-gvr-2026-09-a101', 'hh-gvr-a101', 'fee95ce4-bcfe-45b1-8b8b-0ddee2340796', 'Security charges', 9, 2026, '24x7 Security Charges', 500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('90437ca2-3954-48a9-9734-58644eacc3e9', 'soc-green-valley', 'bill-gvr-2026-10-b201', 'hh-gvr-b201', '79d9e1f6-d7c0-4317-a4d4-b13a82e7c4a3', 'Monthly maintenance', 10, 2026, 'Monthly Maintenance Charges', 2500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('992334e2-bfee-42e2-af73-76114a339df8', 'soc-green-valley', 'bill-gvr-2026-10-a101', 'hh-gvr-a101', '79d9e1f6-d7c0-4317-a4d4-b13a82e7c4a3', 'Monthly maintenance', 10, 2026, 'Monthly Maintenance Charges', 2500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('a62dd426-2871-480e-8d51-2b217ae70aa1', 'soc-green-valley', 'bill-gvr-2026-10-b201', 'hh-gvr-b201', 'f5c8651d-0309-4fa1-b11d-65a615914719', 'Water charges', 10, 2026, 'Water Supply Charges', 400, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('b62f11be-0d0c-4a50-a2ca-6e507cd334c8', 'soc-green-valley', 'bill-gvr-2026-10-a102', 'hh-gvr-a102', '79d9e1f6-d7c0-4317-a4d4-b13a82e7c4a3', 'Monthly maintenance', 10, 2026, 'Monthly Maintenance Charges', 2500, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('bc9ebdc2-9f5d-4ba7-89d7-bdc59dcd52e4', 'soc-green-valley', 'bill-gvr-2026-10-b201', 'hh-gvr-b201', 'fee95ce4-bcfe-45b1-8b8b-0ddee2340796', 'Security charges', 10, 2026, '24x7 Security Charges', 500, 0, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `bill_adjustments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bill_adjustments` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `bill_id` VARCHAR(64) NOT NULL,
  `adjustment_type` TEXT NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `reason` TEXT NOT NULL,
  `created_by` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bill_adjustments_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `payments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `household_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `payment_method` TEXT NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `payment_date` VARCHAR(64) NOT NULL,
  `reference_number` TEXT NOT NULL,
  `proof_url` LONGTEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `verification_notes` TEXT NULL,
  `verified_by` TEXT NULL,
  `verified_at` VARCHAR(64) NULL,
  `ledger_posted` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payments_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `payments`
INSERT IGNORE INTO `payments` (`id`, `society_id`, `household_id`, `member_id`, `payment_method`, `amount`, `payment_date`, `reference_number`, `proof_url`, `status`, `verification_notes`, `verified_by`, `verified_at`, `ledger_posted`, `created_at`, `updated_at`) VALUES ('pay-gvr-oct-a102-pending', 'soc-green-valley', 'hh-gvr-a102', 'member-gvr-a102', 'GPAY_UPI', 3400, '2026-10-16', 'GPAY-628910443120', NULL, 'PENDING_VERIFICATION', NULL, NULL, NULL, 0, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `payments` (`id`, `society_id`, `household_id`, `member_id`, `payment_method`, `amount`, `payment_date`, `reference_number`, `proof_url`, `status`, `verification_notes`, `verified_by`, `verified_at`, `ledger_posted`, `created_at`, `updated_at`) VALUES ('pay-gvr-oct-b201-confirmed', 'soc-green-valley', 'hh-gvr-b201', 'member-gvr-b201', 'RAZORPAY', 3400, '2026-10-14', 'pay_OctB201Rzp991', NULL, 'CONFIRMED', 'Verified via Razorpay settlement', 'user-admin-green-valley', '2026-10-18 11:02:37', 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `payments` (`id`, `society_id`, `household_id`, `member_id`, `payment_method`, `amount`, `payment_date`, `reference_number`, `proof_url`, `status`, `verification_notes`, `verified_by`, `verified_at`, `ledger_posted`, `created_at`, `updated_at`) VALUES ('pay-gvr-sep-a101', 'soc-green-valley', 'hh-gvr-a101', 'member-gvr-a101', 'UPI', 3400, '2026-09-08', 'UPI-425188992011', NULL, 'CONFIRMED', 'Verified against HDFC bank statement', 'user-admin-green-valley', '2026-09-13 11:02:37', 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `payment_allocations`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_allocations` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `payment_id` VARCHAR(64) NOT NULL,
  `bill_id` VARCHAR(64) NOT NULL,
  `allocated_amount` DECIMAL(14,2) NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_allocations_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `payment_allocations`
INSERT IGNORE INTO `payment_allocations` (`id`, `society_id`, `payment_id`, `bill_id`, `allocated_amount`, `created_at`) VALUES ('197d1538-af38-4afd-841a-a86bfdfa6321', 'soc-green-valley', 'pay-gvr-sep-a101', 'bill-gvr-2026-09-a101', 3400, '2026-10-21 11:02:37');
INSERT IGNORE INTO `payment_allocations` (`id`, `society_id`, `payment_id`, `bill_id`, `allocated_amount`, `created_at`) VALUES ('69ef864b-3afb-4193-89dd-64ee8ac03578', 'soc-green-valley', 'pay-gvr-oct-b201-confirmed', 'bill-gvr-2026-10-b201', 3400, '2026-10-21 11:02:37');
INSERT IGNORE INTO `payment_allocations` (`id`, `society_id`, `payment_id`, `bill_id`, `allocated_amount`, `created_at`) VALUES ('9fc8c371-922d-42b6-b06f-eb212007819b', 'soc-green-valley', 'pay-gvr-oct-a102-pending', 'bill-gvr-2026-10-a102', 3400, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `payment_receipts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `payment_id` VARCHAR(64) NOT NULL,
  `receipt_number` VARCHAR(191) NOT NULL,
  `issued_to_name` TEXT NOT NULL,
  `flat_number` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `payment_method` TEXT NOT NULL,
  `reference_number` TEXT NOT NULL,
  `issued_by` TEXT NULL,
  `issued_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_receipts_society_id` (`society_id`),
  UNIQUE KEY `uk_payment_receipts_number` (`receipt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `payment_receipts`
INSERT IGNORE INTO `payment_receipts` (`id`, `society_id`, `payment_id`, `receipt_number`, `issued_to_name`, `flat_number`, `amount`, `payment_method`, `reference_number`, `issued_by`, `issued_at`) VALUES ('50837620-65c6-4833-8ebb-e0cc8b730b4f', 'soc-green-valley', 'pay-gvr-sep-a101', 'RCP-GVR-2026-0001', 'Manpreet Singh Brar', 'A-101', 3400, 'UPI', 'UPI-425188992011', 'user-admin-green-valley', '2026-10-21 11:02:37');
INSERT IGNORE INTO `payment_receipts` (`id`, `society_id`, `payment_id`, `receipt_number`, `issued_to_name`, `flat_number`, `amount`, `payment_method`, `reference_number`, `issued_by`, `issued_at`) VALUES ('665e44a2-29ca-4648-8776-d3180d90410b', 'soc-green-valley', 'pay-gvr-oct-b201-confirmed', 'RCP-GVR-2026-0002', 'Rajesh Kumar Sharma', 'B-201', 3400, 'RAZORPAY', 'pay_OctB201Rzp991', 'user-admin-green-valley', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `staff_roles`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_roles` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_office_bearer` INT NOT NULL DEFAULT 0,
  `is_system_default` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_staff_roles_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `staff_roles`
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('14b28b55-c66a-4b80-9f8f-4079a7ab572a', 'soc-royal-palms', 'Security Supervisor', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('17e6f539-bff3-4d2e-a662-9c36b7357e23', 'soc-royal-palms', 'President', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('1874c6d6-ea0f-4f4a-8490-aca59262ed5a', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Joint Secretary', 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('271c2cff-f6d5-46d8-a25f-d004a8012037', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Vice President', 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('33c36120-e702-4aac-8697-9ef1aca62a3d', 'soc-royal-palms', 'Maintenance Staff', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('3882a5e1-f4f7-45d9-b2fb-14d8bee919c7', 'soc-green-valley', 'Office Administrator', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('3c6c4ad9-c3b8-476e-9394-500257a0f1bd', 'soc-green-valley', 'Security Guard', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('4ff3bda1-453a-4a34-9b3d-c18ec61cca67', 'soc-green-valley', 'Joint Secretary', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('51317cf0-2cd1-408d-baba-4dafaba6b9d3', 'soc-royal-palms', 'Office Administrator', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('5c3977ef-a9bb-4d86-83f5-729a0c1c791f', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Cashier', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('604eb594-4e05-4fe5-b50c-a61467de06f1', '481217da-9f91-4d17-86a6-dc4f17725a75', 'President', 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('613bc4b5-10a5-4387-8335-e393fa702add', 'soc-green-valley', 'President', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('63a5f672-90a4-43e5-8667-8e4ddc851c76', 'soc-royal-palms', 'Vice President', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('63c575ed-a5aa-409a-b0a6-2dcdc343109f', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Security Supervisor', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('705b382c-7248-42bd-aa94-1d3baadb76b9', 'soc-green-valley', 'Cashier', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('7ba524a0-c1a8-47f6-9069-9200c6e46968', 'soc-green-valley', 'Vice President', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('85e3cd70-7e6e-4bb4-9299-7ca57a833c6d', 'soc-royal-palms', 'Security Guard', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('87424643-ff88-4779-bee8-2e8657dde227', 'soc-royal-palms', 'Accountant', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('8933deaf-efbc-4e70-a11c-fe7accc1277b', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Office Administrator', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('89d1b5a1-523e-4f49-aa73-769f7cfb93ce', 'soc-green-valley', 'Treasurer', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('9d960e9b-090a-4ee6-b226-3e7c03d956d8', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Maintenance Staff', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('9f67964b-88a4-4ddf-b703-103bc39ff01e', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Treasurer', 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('a42bb804-74e3-4ba2-b0c9-1adfaf7fba6c', 'soc-royal-palms', 'Cashier', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('a5acc374-1a16-4b14-b8f4-e0f53779d152', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Maintenance Supervisor', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('b1ddfdc1-fcf0-41d8-8187-bc0a496c9821', 'soc-green-valley', 'Accountant', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('b64ffe20-b00a-45ff-8433-070bc6be485a', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Secretary', 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('bab3566d-451f-4c28-97b6-15b03a8f1c47', 'soc-green-valley', 'Maintenance Supervisor', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('c530bac7-103d-4070-ae6f-90bd3d32ffeb', 'soc-royal-palms', 'Treasurer', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('cf241d47-e380-40ec-8379-51cddb24f966', 'soc-royal-palms', 'Joint Secretary', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('dfc07973-2af8-48de-b69d-e358d7cc18c3', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Accountant', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('e285088c-36c0-4209-8a92-384edaa9f3b4', 'soc-royal-palms', 'Secretary', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('ed10788c-af2c-4720-8d9d-482b58dc5bab', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Security Guard', 0, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('f8183610-0e11-4f49-9c23-3ba30b6afd0c', 'soc-green-valley', 'Secretary', 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('f90eac61-3ccb-4224-9f36-466598a83e10', 'soc-royal-palms', 'Maintenance Supervisor', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('fafe68f9-1e75-4308-9081-0eb422687874', 'soc-green-valley', 'Security Supervisor', 0, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('fb2c7f50-a48e-4349-97b9-4ce05a843a49', 'soc-green-valley', 'Maintenance Staff', 0, 1, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `role_permissions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `role_id` VARCHAR(64) NOT NULL,
  `view_members` INT NOT NULL DEFAULT 0,
  `manage_members` INT NOT NULL DEFAULT 0,
  `generate_bills` INT NOT NULL DEFAULT 0,
  `verify_payments` INT NOT NULL DEFAULT 0,
  `manage_expenses` INT NOT NULL DEFAULT 0,
  `view_financial_reports` INT NOT NULL DEFAULT 0,
  `manage_complaints` INT NOT NULL DEFAULT 0,
  `manage_events` INT NOT NULL DEFAULT 0,
  `manage_staff` INT NOT NULL DEFAULT 0,
  `change_society_settings` INT NOT NULL DEFAULT 0,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_role_permissions_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `role_permissions`
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('00260d49-a5c9-4679-9360-2fbf7f8a7a35', 'soc-royal-palms', '51317cf0-2cd1-408d-baba-4dafaba6b9d3', 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('01fc9665-02fe-4e43-ac37-f782748ccc10', 'soc-green-valley', '4ff3bda1-453a-4a34-9b3d-c18ec61cca67', 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('09e3ae66-bf72-4b02-9f02-01aee749eceb', 'soc-green-valley', '89d1b5a1-523e-4f49-aa73-769f7cfb93ce', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('0cd73650-c10a-4220-8ba0-c843aa99b986', 'soc-green-valley', '3c6c4ad9-c3b8-476e-9394-500257a0f1bd', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('0d90803e-4c53-4008-8a89-d599f1595b6a', 'soc-green-valley', '7ba524a0-c1a8-47f6-9069-9200c6e46968', 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('0e27b1d1-1644-4990-9b05-e179c91302a1', '481217da-9f91-4d17-86a6-dc4f17725a75', '63c575ed-a5aa-409a-b0a6-2dcdc343109f', 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('15be2077-a52b-4158-80a8-f18cf74298a9', '481217da-9f91-4d17-86a6-dc4f17725a75', 'a5acc374-1a16-4b14-b8f4-e0f53779d152', 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('214e68ca-a4b4-4922-a47e-f4d22d51e82e', '481217da-9f91-4d17-86a6-dc4f17725a75', 'ed10788c-af2c-4720-8d9d-482b58dc5bab', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('3932ad74-2554-448f-a392-f26b10ac20aa', 'soc-green-valley', 'fafe68f9-1e75-4308-9081-0eb422687874', 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('3a47d42c-4633-44a3-a01d-8b14d4706eb6', 'soc-green-valley', 'bab3566d-451f-4c28-97b6-15b03a8f1c47', 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('3bb5e732-1aee-47cd-84ce-9e0d2428d4bc', 'soc-green-valley', 'fb2c7f50-a48e-4349-97b9-4ce05a843a49', 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('4e9cf8be-e0d6-4c1b-9c88-6713d036da4d', 'soc-royal-palms', 'cf241d47-e380-40ec-8379-51cddb24f966', 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('565ecb23-29d9-4cc4-8be1-70d99f93fd5c', 'soc-royal-palms', '63a5f672-90a4-43e5-8667-8e4ddc851c76', 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('6649cb53-1ee1-45af-bf61-f41f4550b0d6', 'soc-green-valley', '3882a5e1-f4f7-45d9-b2fb-14d8bee919c7', 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('6ceaf60c-0150-40c5-9d12-1ff03e56b87a', 'soc-royal-palms', '33c36120-e702-4aac-8697-9ef1aca62a3d', 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('6ecfa88e-92fb-490a-b50e-01162ca3192f', 'soc-royal-palms', '87424643-ff88-4779-bee8-2e8657dde227', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('72470e00-1456-43f9-844d-a425e89d094b', '481217da-9f91-4d17-86a6-dc4f17725a75', 'b64ffe20-b00a-45ff-8433-070bc6be485a', 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('7536f845-2517-4496-a167-5ecb707fbd5d', 'soc-green-valley', '705b382c-7248-42bd-aa94-1d3baadb76b9', 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('7dba9873-c92b-4b91-b859-515982df4b19', 'soc-green-valley', 'f8183610-0e11-4f49-9c23-3ba30b6afd0c', 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('8115637b-6afe-4973-831a-6fc56799f435', 'soc-royal-palms', 'f90eac61-3ccb-4224-9f36-466598a83e10', 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('8801ab80-1bab-4b17-8957-5734f158b0e3', '481217da-9f91-4d17-86a6-dc4f17725a75', '5c3977ef-a9bb-4d86-83f5-729a0c1c791f', 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('91dd7ded-18f2-464e-8a6a-6bad7bf0f232', '481217da-9f91-4d17-86a6-dc4f17725a75', '604eb594-4e05-4fe5-b50c-a61467de06f1', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('990b4bb5-a413-4bb1-8b95-bd7193da38dc', '481217da-9f91-4d17-86a6-dc4f17725a75', '271c2cff-f6d5-46d8-a25f-d004a8012037', 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('a8f9b730-9916-4914-857e-bf7a8e35c10e', '481217da-9f91-4d17-86a6-dc4f17725a75', '1874c6d6-ea0f-4f4a-8490-aca59262ed5a', 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('aa7a5d31-34e6-42a1-9bd8-585f96748a7c', 'soc-royal-palms', 'e285088c-36c0-4209-8a92-384edaa9f3b4', 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('aae32ae7-29e8-4ea9-a603-65cf75c11590', '481217da-9f91-4d17-86a6-dc4f17725a75', '8933deaf-efbc-4e70-a11c-fe7accc1277b', 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('ad89f7ff-b6a5-4a33-ad86-7b36484140b2', 'soc-royal-palms', '14b28b55-c66a-4b80-9f8f-4079a7ab572a', 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('b5e86b39-30f0-4e54-86cf-73adbf365ec1', '481217da-9f91-4d17-86a6-dc4f17725a75', '9d960e9b-090a-4ee6-b226-3e7c03d956d8', 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('c464f817-9eae-43d5-9031-5fa78569cc86', 'soc-royal-palms', '17e6f539-bff3-4d2e-a662-9c36b7357e23', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('c8cd3105-aa10-4da2-8379-66acabc3122d', '481217da-9f91-4d17-86a6-dc4f17725a75', 'dfc07973-2af8-48de-b69d-e358d7cc18c3', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('cf99ffdf-847a-49d5-b186-fa0c9295e183', 'soc-green-valley', 'b1ddfdc1-fcf0-41d8-8187-bc0a496c9821', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('e4589cf8-6e27-41ee-ae78-b424f4372067', 'soc-royal-palms', 'a42bb804-74e3-4ba2-b0c9-1adfaf7fba6c', 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('e826ec94-3e0b-4f31-9de1-b6f64ee06972', 'soc-royal-palms', '85e3cd70-7e6e-4bb4-9299-7ca57a833c6d', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('f1c6d15d-87b6-4d82-8620-b8b9b90cc4f4', 'soc-royal-palms', 'c530bac7-103d-4070-ae6f-90bd3d32ffeb', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('f53f264b-0132-415b-bdc3-3d34e506db2b', '481217da-9f91-4d17-86a6-dc4f17725a75', '9f67964b-88a4-4ddf-b703-103bc39ff01e', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('fc60e969-2dfc-4179-a7cd-2c5f12d098bb', 'soc-green-valley', '613bc4b5-10a5-4387-8335-e393fa702add', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `staff`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `role_id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `photo_url` LONGTEXT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `designation` TEXT NOT NULL,
  `joining_date` VARCHAR(64) NOT NULL,
  `wage_type` TEXT NOT NULL,
  `salary_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `employment_status` TEXT NOT NULL,
  `is_on_duty` INT NOT NULL DEFAULT 0,
  `duty_schedule` TEXT NULL,
  `assigned_duties` TEXT NULL,
  `show_contact_to_members` INT NOT NULL DEFAULT 1,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_staff_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `staff`
INSERT IGNORE INTO `staff` (`id`, `society_id`, `user_id`, `role_id`, `full_name`, `photo_url`, `phone`, `email`, `address`, `designation`, `joining_date`, `wage_type`, `salary_amount`, `employment_status`, `is_on_duty`, `duty_schedule`, `assigned_duties`, `show_contact_to_members`, `created_at`, `updated_at`) VALUES ('staff-gvr-cashier', 'soc-green-valley', 'user-staff-cashier-gvr', '705b382c-7248-42bd-aa94-1d3baadb76b9', 'Balwinder Singh', NULL, '+91-98152-33445', 'cashier@greenvalley.com', 'Phase 7, Mohali', 'Society Cashier', '2024-01-15', 'MONTHLY', 22000, 'ACTIVE', 1, 'Mon-Sat 09:00 AM - 05:00 PM', 'Payment verification, receipt generation & collection desk', 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff` (`id`, `society_id`, `user_id`, `role_id`, `full_name`, `photo_url`, `phone`, `email`, `address`, `designation`, `joining_date`, `wage_type`, `salary_amount`, `employment_status`, `is_on_duty`, `duty_schedule`, `assigned_duties`, `show_contact_to_members`, `created_at`, `updated_at`) VALUES ('staff-gvr-guard', 'soc-green-valley', NULL, '3c6c4ad9-c3b8-476e-9394-500257a0f1bd', 'Sukhdev Singh', NULL, '+91-98152-77889', 'sukhdev.guard@greenvalley.com', 'Sohana, Mohali', 'Head Security Guard', '2023-06-01', 'MONTHLY', 18500, 'ACTIVE', 1, 'Daily 08:00 AM - 08:00 PM (Gate 1)', 'Main Gate Entry/Exit & Visitor Verification', 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `staff` (`id`, `society_id`, `user_id`, `role_id`, `full_name`, `photo_url`, `phone`, `email`, `address`, `designation`, `joining_date`, `wage_type`, `salary_amount`, `employment_status`, `is_on_duty`, `duty_schedule`, `assigned_duties`, `show_contact_to_members`, `created_at`, `updated_at`) VALUES ('staff-gvr-plumber', 'soc-green-valley', NULL, 'fb2c7f50-a48e-4349-97b9-4ce05a843a49', 'Rameshwar Prasad', NULL, '+91-98152-99001', NULL, 'Kharar, Mohali', 'Plumber & Electrician', '2024-03-10', 'MONTHLY', 19500, 'ACTIVE', 1, 'Daily 09:00 AM - 06:00 PM', 'Water supply, electrical panel & pump room maintenance', 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `staff_documents`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_documents` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `staff_id` VARCHAR(64) NOT NULL,
  `document_type` TEXT NOT NULL,
  `masked_document_number` TEXT NOT NULL,
  `document_url` LONGTEXT NOT NULL,
  `uploaded_by` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_staff_documents_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `staff_duty_records`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff_duty_records` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `staff_id` VARCHAR(64) NOT NULL,
  `duty_status` TEXT NOT NULL,
  `shift_notes` TEXT NULL,
  `changed_by` TEXT NULL,
  `changed_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_staff_duty_records_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `attendance_records`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `staff_id` VARCHAR(64) NOT NULL,
  `attendance_date` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `check_in_time` TEXT NULL,
  `check_out_time` TEXT NULL,
  `salary_paid` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `recorded_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_records_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `complaints`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `complaint_number` VARCHAR(191) NOT NULL,
  `household_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `flat_number` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `priority` TEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
  `assigned_staff_id` VARCHAR(64) NULL,
  `resolution_notes` TEXT NULL,
  `resolution_image_url` LONGTEXT NULL,
  `resolved_at` VARCHAR(64) NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_complaints_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `complaints`
INSERT IGNORE INTO `complaints` (`id`, `society_id`, `complaint_number`, `household_id`, `member_id`, `flat_number`, `title`, `category`, `description`, `priority`, `status`, `assigned_staff_id`, `resolution_notes`, `resolution_image_url`, `resolved_at`, `created_at`, `updated_at`) VALUES ('comp-gvr-001', 'soc-green-valley', 'CMP-GVR-1001', 'hh-gvr-a101', 'member-gvr-a101', 'A-101', 'Low water pressure in Block A morning supply', 'Water supply', 'Water pressure on 1st floor has been low between 7 AM and 8:30 AM for the past two days.', 'HIGH', 'IN_PROGRESS', 'staff-gvr-plumber', NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `complaint_attachments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaint_attachments` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `complaint_id` VARCHAR(64) NOT NULL,
  `file_url` LONGTEXT NOT NULL,
  `file_type` TEXT NOT NULL,
  `uploaded_by` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_complaint_attachments_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `complaint_comments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaint_comments` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `complaint_id` VARCHAR(64) NOT NULL,
  `author_user_id` VARCHAR(64) NOT NULL,
  `author_name` TEXT NOT NULL,
  `comment_text` TEXT NOT NULL,
  `is_internal` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_complaint_comments_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `complaint_comments`
INSERT IGNORE INTO `complaint_comments` (`id`, `society_id`, `complaint_id`, `author_user_id`, `author_name`, `comment_text`, `is_internal`, `created_at`) VALUES ('58707398-5fde-4c72-b829-dd15c597d8dc', 'soc-green-valley', 'comp-gvr-001', 'user-admin-green-valley', 'Harpreet Singh Gill (RWA President)', 'Assigned Plumber Rameshwar Prasad to inspect Block A overhead booster valve today.', 0, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `suggestions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `household_id` VARCHAR(64) NOT NULL,
  `member_id` VARCHAR(64) NOT NULL,
  `flat_number` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
  `admin_response` TEXT NULL,
  `responded_by` TEXT NULL,
  `responded_at` VARCHAR(64) NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_suggestions_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `suggestions`
INSERT IGNORE INTO `suggestions` (`id`, `society_id`, `household_id`, `member_id`, `flat_number`, `title`, `description`, `status`, `admin_response`, `responded_by`, `responded_at`, `created_at`) VALUES ('364adc05-4db5-48ba-9950-e7054538c050', 'soc-green-valley', 'hh-gvr-a101', 'member-gvr-a101', 'A-101', 'Install EV Charging Point in Visitor Parking Zone', 'Many residents are buying electric two-wheelers and cars. A shared metered EV charging bay would benefit everyone.', 'ACKNOWLEDGED', 'Great suggestion! Added to the agenda for the upcoming General Body Meeting.', 'user-admin-green-valley', '2026-10-19 11:02:37', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `society_events`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `society_events` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `event_type` TEXT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `event_date` VARCHAR(64) NOT NULL,
  `event_time` TEXT NOT NULL,
  `venue` TEXT NOT NULL,
  `image_url` LONGTEXT NULL,
  `publication_status` TEXT NOT NULL,
  `created_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_society_events_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `society_events`
INSERT IGNORE INTO `society_events` (`id`, `society_id`, `event_type`, `title`, `description`, `event_date`, `event_time`, `venue`, `image_url`, `publication_status`, `created_by`, `created_at`) VALUES ('1ca35c42-1c8b-4fd7-9863-f502759bbc73', 'soc-green-valley', 'MEETING', 'Annual General Body Meeting (AGM) 2026', 'Review of annual society accounts, security upgrade approval, and solar rooftop proposal.', '2026-10-25', '11:00 AM', 'Society Community Hall, Block A', NULL, 'PUBLISHED', 'user-admin-green-valley', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_events` (`id`, `society_id`, `event_type`, `title`, `description`, `event_date`, `event_time`, `venue`, `image_url`, `publication_status`, `created_by`, `created_at`) VALUES ('62ac5612-aaf5-4865-a4ff-2a3a12b3a8be', 'soc-green-valley', 'FESTIVAL', 'Grand Diwali & Bandi Chhor Divas Mela', 'Cultural evening, langar, lights competition, and community dinner for all residents.', '2026-11-01', '06:30 PM', 'Central Lawn & Amphitheatre', NULL, 'PUBLISHED', 'user-admin-green-valley', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `announcements`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `category` TEXT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `image_url` LONGTEXT NULL,
  `publication_status` TEXT NOT NULL,
  `send_email` INT NOT NULL DEFAULT 1,
  `created_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_announcements_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `announcements`
INSERT IGNORE INTO `announcements` (`id`, `society_id`, `category`, `title`, `content`, `image_url`, `publication_status`, `send_email`, `created_by`, `created_at`) VALUES ('070e6bb3-5625-4653-a246-2b3dba6a3c6e', 'soc-green-valley', 'WATER_INTERRUPTION', 'Overhead Water Tank Cleaning Schedule — Block A & B', 'Overhead water tanks will be hygienically cleaned on Sunday from 10:00 AM to 01:00 PM. Please store water accordingly.', NULL, 'PUBLISHED', 1, 'user-admin-green-valley', '2026-10-21 11:02:37');
INSERT IGNORE INTO `announcements` (`id`, `society_id`, `category`, `title`, `content`, `image_url`, `publication_status`, `send_email`, `created_by`, `created_at`) VALUES ('58519bde-c071-4361-9276-676671213d12', 'soc-green-valley', 'SECURITY_ALERT', 'Mandatory Sticker Verification for Resident Vehicles', 'All residents are requested to collect their 2026 RFID vehicle stickers from the RWA office between 9 AM and 5 PM.', NULL, 'PUBLISHED', 1, 'user-admin-green-valley', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `financial_accounts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `financial_accounts` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `account_type` VARCHAR(191) NOT NULL,
  `account_name` TEXT NOT NULL,
  `opening_balance` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `current_balance` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_financial_accounts_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `financial_accounts`
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('17cb0462-38fb-486e-b480-face3d0010b4', 'soc-royal-palms', 'BANK', 'Society Main RWA Bank Account', 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('198598b9-9c5e-4803-9b6d-dcd28b53e8e1', '481217da-9f91-4d17-86a6-dc4f17725a75', 'CASH', 'Society Petty Cash Account', 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('63f235b7-4e24-4fb9-b937-622c091a33b7', '481217da-9f91-4d17-86a6-dc4f17725a75', 'BANK', 'Society Main RWA Bank Account', 0, 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('9d861bfc-a8d3-4e6d-ada1-c2bf7c4707a3', 'soc-royal-palms', 'CASH', 'Society Petty Cash Account', 0, 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('9efd7af2-c454-4cad-b593-4fedd782a7b9', 'soc-green-valley', 'CASH', 'Society Petty Cash Account', 5000, 5000, '2026-10-21 11:02:37');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('c70304f1-5e64-4a88-a29d-0649e18e2ce5', 'soc-green-valley', 'BANK', 'Society Main RWA Bank Account', 25000, 30000, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `expense_categories`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `is_active` INT NOT NULL DEFAULT 1,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expense_categories_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `expense_categories`
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('0e946025-8612-4a6c-93e9-2e4c162a20e4', 'soc-royal-palms', 'Water Tanker & Pump Repair', 'Standard expense head: Water Tanker & Pump Repair', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('121d6db2-8e66-4e8e-9a7c-1f56873555dd', 'soc-green-valley', 'Common Area Electricity Bill', 'Standard expense head: Common Area Electricity Bill', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('23f19412-7944-49c6-a2db-4a204c06f0f4', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Water Tanker & Pump Repair', 'Standard expense head: Water Tanker & Pump Repair', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('2bc4e877-c333-4694-8e92-7c950ece46f2', 'soc-green-valley', 'Lift AMC & Maintenance', 'Standard expense head: Lift AMC & Maintenance', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('3b4f729b-6927-4632-8021-11ba7e6dc7ad', 'soc-royal-palms', 'Diesel for Generator', 'Standard expense head: Diesel for Generator', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('3f5e14a6-1dc0-41fc-8d33-6f4877a4e777', 'soc-green-valley', 'Diesel for Generator', 'Standard expense head: Diesel for Generator', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('532eb910-1a96-42a6-8283-9790b4f0968f', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Security Services & Guards', 'Standard expense head: Security Services & Guards', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('5b486872-34ee-47b5-852e-e554af1a0ffa', 'soc-royal-palms', 'Security Services & Guards', 'Standard expense head: Security Services & Guards', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('7218ae10-5d41-467c-bf19-dc32b20f7158', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Garden & Landscaping', 'Standard expense head: Garden & Landscaping', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('76be13ac-b18f-43f0-872b-10af221011e8', 'soc-green-valley', 'Festival & Community Events', 'Standard expense head: Festival & Community Events', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('7844888e-324f-4b27-a0f9-8c19aa779fb1', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Office Stationery & Admin', 'Standard expense head: Office Stationery & Admin', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('786f046c-59fe-4318-98f3-9c1d7898ce16', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Lift AMC & Maintenance', 'Standard expense head: Lift AMC & Maintenance', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('8085d0c7-43a3-44b1-9b28-265ec895af2d', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Common Area Electricity Bill', 'Standard expense head: Common Area Electricity Bill', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('8175e2e3-d0f7-4b34-b948-9522f85e219f', 'soc-green-valley', 'Office Stationery & Admin', 'Standard expense head: Office Stationery & Admin', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('878e58b4-ea15-4897-802e-7bb689653083', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Festival & Community Events', 'Standard expense head: Festival & Community Events', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('a0384bcd-3249-46ad-8a84-0073e51345b6', 'soc-royal-palms', 'Office Stationery & Admin', 'Standard expense head: Office Stationery & Admin', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('a31ff661-db1b-4fa8-8228-77ccf1989b21', 'soc-green-valley', 'Water Tanker & Pump Repair', 'Standard expense head: Water Tanker & Pump Repair', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('b1459be5-3f0e-44e4-a7fe-8a83960e9dca', 'soc-royal-palms', 'Lift AMC & Maintenance', 'Standard expense head: Lift AMC & Maintenance', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('b50aca33-5f21-4892-b49b-5b7966a3267b', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Diesel for Generator', 'Standard expense head: Diesel for Generator', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('bd04f02e-afe3-4b85-b259-39e2ffa23668', 'soc-green-valley', 'Garden & Landscaping', 'Standard expense head: Garden & Landscaping', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('bf731b33-a7dd-4ab7-ba5d-35c9cb73a969', 'soc-royal-palms', 'Festival & Community Events', 'Standard expense head: Festival & Community Events', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('c7670dcc-1818-4c44-93fc-2346b4d1c903', 'soc-royal-palms', 'Garden & Landscaping', 'Standard expense head: Garden & Landscaping', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('d2a33fce-b90c-42e5-bc3b-c048b4835179', 'soc-green-valley', 'Security Services & Guards', 'Standard expense head: Security Services & Guards', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('de8bd2e3-a9e9-4d00-a61e-e4edc1693bd2', 'soc-royal-palms', 'Housekeeping & Sanitation', 'Standard expense head: Housekeeping & Sanitation', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('e435a274-6cf2-4c15-aba2-e18b3075e0db', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Housekeeping & Sanitation', 'Standard expense head: Housekeeping & Sanitation', 1, '2026-10-21 21:38:32');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('ead14afa-3506-42b6-ae06-73c367ba30ca', 'soc-royal-palms', 'Common Area Electricity Bill', 'Standard expense head: Common Area Electricity Bill', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('f974e82e-4d68-42a0-b906-6facc7946bcc', 'soc-green-valley', 'Housekeeping & Sanitation', 'Standard expense head: Housekeeping & Sanitation', 1, '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `expenses`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `expense_category_id` VARCHAR(64) NOT NULL,
  `category_name` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `expense_date` VARCHAR(64) NOT NULL,
  `payment_method` TEXT NOT NULL,
  `account_type` VARCHAR(191) NOT NULL,
  `vendor_name` TEXT NOT NULL,
  `invoice_url` LONGTEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
  `entered_by` TEXT NOT NULL,
  `approved_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `expenses`
INSERT IGNORE INTO `expenses` (`id`, `society_id`, `expense_category_id`, `category_name`, `description`, `amount`, `expense_date`, `payment_method`, `account_type`, `vendor_name`, `invoice_url`, `status`, `entered_by`, `approved_by`, `created_at`) VALUES ('exp-gvr-oct-01', 'soc-green-valley', 'd2a33fce-b90c-42e5-bc3b-c048b4835179', 'Security Services & Guards', 'Main Gate Security Guard Duty Settlement (First Half Oct)', 1800, '2026-10-15', 'BANK_TRANSFER', 'BANK', 'ShieldForce Security Pvt Ltd', NULL, 'APPROVED', 'user-admin-green-valley', 'user-admin-green-valley', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `ledger_entries`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ledger_entries` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NOT NULL,
  `transaction_code` VARCHAR(191) NOT NULL,
  `entry_date` VARCHAR(64) NOT NULL,
  `entry_type` VARCHAR(191) NOT NULL,
  `account_type` VARCHAR(191) NOT NULL,
  `category` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `direction` TEXT NOT NULL,
  `reference_type` VARCHAR(191) NOT NULL,
  `reference_id` VARCHAR(64) NOT NULL,
  `household_id` VARCHAR(64) NULL,
  `flat_number` VARCHAR(191) NULL,
  `member_id` VARCHAR(64) NULL,
  `payment_method` TEXT NULL,
  `reversal_of_entry_id` VARCHAR(64) NULL,
  `created_by` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ledger_entries_society_id` (`society_id`),
  UNIQUE KEY `uk_ledger_entries_txn_code` (`transaction_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `ledger_entries`
INSERT IGNORE INTO `ledger_entries` (`id`, `society_id`, `transaction_code`, `entry_date`, `entry_type`, `account_type`, `category`, `description`, `amount`, `direction`, `reference_type`, `reference_id`, `household_id`, `flat_number`, `member_id`, `payment_method`, `reversal_of_entry_id`, `created_by`, `created_at`) VALUES ('2e40aa6a-5741-4584-bbdd-f54862863844', 'soc-green-valley', 'TXN-GVR-2026-0003', '2026-10-15', 'EXPENSE', 'BANK', 'Security Services & Guards', 'Main Gate Security Guard Duty Settlement (First Half Oct)', 1800, 'DEBIT', 'EXPENSE', 'exp-gvr-oct-01', NULL, NULL, NULL, 'BANK_TRANSFER', NULL, 'user-admin-green-valley', '2026-10-21 11:02:37');
INSERT IGNORE INTO `ledger_entries` (`id`, `society_id`, `transaction_code`, `entry_date`, `entry_type`, `account_type`, `category`, `description`, `amount`, `direction`, `reference_type`, `reference_id`, `household_id`, `flat_number`, `member_id`, `payment_method`, `reversal_of_entry_id`, `created_by`, `created_at`) VALUES ('c7b04121-6763-49e5-912f-1a8f20638079', 'soc-green-valley', 'TXN-GVR-2026-0001', '2026-09-08', 'INCOME', 'BANK', 'Maintenance Collection', 'Bill payment RCP-GVR-2026-0001 (Flat A-101)', 3400, 'CREDIT', 'PAYMENT', 'pay-gvr-sep-a101', 'hh-gvr-a101', 'A-101', 'member-gvr-a101', 'UPI', NULL, 'user-admin-green-valley', '2026-10-21 11:02:37');
INSERT IGNORE INTO `ledger_entries` (`id`, `society_id`, `transaction_code`, `entry_date`, `entry_type`, `account_type`, `category`, `description`, `amount`, `direction`, `reference_type`, `reference_id`, `household_id`, `flat_number`, `member_id`, `payment_method`, `reversal_of_entry_id`, `created_by`, `created_at`) VALUES ('e218ffe3-72a6-4011-abd2-9950a2673bee', 'soc-green-valley', 'TXN-GVR-2026-0002', '2026-10-14', 'INCOME', 'BANK', 'Maintenance Collection', 'Bill payment RCP-GVR-2026-0002 (Flat B-201)', 3400, 'CREDIT', 'PAYMENT', 'pay-gvr-oct-b201-confirmed', 'hh-gvr-b201', 'B-201', 'member-gvr-b201', 'RAZORPAY', NULL, 'user-admin-green-valley', '2026-10-21 11:02:37');

-- --------------------------------------------------------
-- Table structure for table `notifications`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NULL,
  `user_id` VARCHAR(64) NULL,
  `notification_type` TEXT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` LONGTEXT NOT NULL,
  `channel` TEXT NOT NULL,
  `dedup_key` VARCHAR(191) NULL,
  `is_read` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `notifications`
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('30b3d0ab-73fb-4cb6-bbbf-4057188c440f', 'soc-green-valley', 'user-admin-green-valley', 'SUBSCRIPTION_PAYMENT_CONFIRMED', 'Enterprise Annual Subscription Active & Verified', 'Super Admin Notice: Your Enterprise Annual RWA Suite subscription is active and fully approved. Next renewal is scheduled in 335 days.', 'IN_APP', 'seed:sub-active:soc-green-valley', 0, '2026-10-21 11:02:37');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('463d2d38-7b52-48d9-a111-d3a94292c8c3', 'soc-royal-palms', 'user-admin-royal-palms', 'TRIAL_EXPIRY', 'Free Trial Expiring in 11 Day(s)', 'Your Royal Palms Enclave (Demo) plan expires on 2026-11-01. Renew now for uninterrupted access.', 'EMAIL', 'sub-exp:soc-royal-palms:2026-11-01', 1, '2026-10-21 21:32:39');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('90d7dab9-63b8-4b9c-90ca-dc08a87e2041', '481217da-9f91-4d17-86a6-dc4f17725a75', NULL, 'SUBSCRIPTION_PAYMENT_CONFIRMED', 'Subscription Renewed & Active — Starter Monthly Plan', 'Subscription payment of ₹2,358.82 (Ref: pay_0cfcfff7ad4f46) is verified. Your society subscription is ACTIVE until 20/11/2026.', 'IN_APP', NULL, 0, '2026-10-21 21:38:36');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('92c5075d-3e95-4128-b082-eda476d4dd6d', 'soc-royal-palms', 'user-admin-royal-palms', 'SUBSCRIPTION_PAYMENT_DUE', 'Subscription Payment Due for Approval — Growth Quarterly Plan (₹6,488.82)', 'Super Admin Notice: Your society free trial is ending in 11 days. Please complete your subscription payment of ₹6,488.82 (₹5,499 + 18% GST) for continued active approval and uninterrupted portal access.', 'IN_APP', 'seed:sub-due:soc-royal-palms', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('a2d32fb7-a2cf-4e32-8335-6cc54bf39776', '481217da-9f91-4d17-86a6-dc4f17725a75', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'SOCIETY_REGISTERED', 'Society Registration Created — Complete Subscription Payment', 'Please complete your subscription payment to activate kuku homes.', 'EMAIL', 'soc-reg:481217da-9f91-4d17-86a6-dc4f17725a75', 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('afd37a00-248d-437b-9b44-e052ad08f21a', '481217da-9f91-4d17-86a6-dc4f17725a75', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'SUBSCRIPTION_RENEWAL', 'Subscription Expiring in 30 Day(s)', 'Your kuku homes plan expires on 2026-11-20. Renew now for uninterrupted access.', 'EMAIL', 'sub-exp:481217da-9f91-4d17-86a6-dc4f17725a75:2026-11-20', 0, '2026-10-21 21:41:49');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('f3c791a0-4aa2-4cb7-988f-07640a6df86c', 'soc-royal-palms', NULL, 'SUBSCRIPTION_PAYMENT_CONFIRMED', 'Subscription Renewed & Active — Growth Quarterly Plan', 'Subscription payment of ₹6,488.82 (Ref: pay_ba6aa49ef4104c) is verified. Your society subscription is ACTIVE until 19/1/2027.', 'IN_APP', NULL, 0, '2026-10-21 21:37:28');

-- --------------------------------------------------------
-- Table structure for table `audit_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `society_id` VARCHAR(64) NULL,
  `actor_user_id` VARCHAR(64) NULL,
  `actor_role` TEXT NOT NULL,
  `action` TEXT NOT NULL,
  `entity_type` TEXT NOT NULL,
  `entity_id` VARCHAR(64) NULL,
  `details` LONGTEXT NOT NULL,
  `ip_address` TEXT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_society_id` (`society_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `audit_logs`
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('3747ff53-098c-42ce-a9d8-8caebcd2fe10', 'soc-royal-palms', NULL, 'RAZORPAY_CHECKOUT', 'SUBSCRIPTION_PAYMENT_VERIFIED', 'SUBSCRIPTION_PAYMENT', '2ebdc2cb-0ecf-47c5-87d6-292ad618e063', '{"orderId":"order_da6404f4434049","paymentId":"pay_ba6aa49ef4104c","autoApprove":true}', NULL, '2026-10-21 21:37:28');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('3980edd2-34cf-43e2-9596-8e11828ffd86', '481217da-9f91-4d17-86a6-dc4f17725a75', NULL, 'RAZORPAY_CHECKOUT', 'SUBSCRIPTION_PAYMENT_VERIFIED', 'SUBSCRIPTION_PAYMENT', '36638e2f-a9c5-479f-be3f-5e9e6e54df17', '{"orderId":"order_80dc6ab0c6424e","paymentId":"pay_0cfcfff7ad4f46","autoApprove":true}', NULL, '2026-10-21 21:38:36');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('914296f8-0a6f-4f11-9862-0280c717933a', '481217da-9f91-4d17-86a6-dc4f17725a75', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'SOCIETY_ADMIN', 'SOCIETY_REGISTERED', 'SOCIETY', '481217da-9f91-4d17-86a6-dc4f17725a75', '{"societyName":"kuku homes","planCode":"MONTHLY_STARTER","useTrial":false}', '192.168.65.1', '2026-10-21 21:38:32');

SET FOREIGN_KEY_CHECKS = 1;
