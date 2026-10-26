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
  `subscription_tax_enabled` INT NOT NULL DEFAULT 1,
  `subscription_tax_name` TEXT NOT NULL,
  `subscription_tax_percent` DECIMAL(14,2) NOT NULL DEFAULT 18.0,
  `razorpay_enabled` INT NOT NULL DEFAULT 1,
  `upi_payment_enabled` INT NOT NULL DEFAULT 1,
  `paytm_enabled` INT NOT NULL DEFAULT 0,
  `custom_gateway_enabled` INT NOT NULL DEFAULT 0,
  `meta_title` TEXT NULL,
  `meta_description` LONGTEXT NULL,
  `meta_keywords` TEXT NULL,
  `meta_author` TEXT NULL,
  `meta_og_image` TEXT NULL,
  `favicon_url` LONGTEXT NULL,
  `google_adsense_enabled` INT NOT NULL DEFAULT 0,
  `google_adsense_client_id` VARCHAR(64) NULL,
  `google_ad_slot_header` TEXT NULL,
  `google_ad_slot_sidebar` TEXT NULL,
  `google_ad_slot_footer` TEXT NULL,
  `google_analytics_id` VARCHAR(64) NULL,
  `custom_header_scripts` TEXT NULL,
  `logo_url` LONGTEXT NULL,
  `dark_logo_url` LONGTEXT NULL,
  `webhook_url` TEXT NULL,
  `webhook_secret` TEXT NULL,
  `webhook_enabled` INT NOT NULL DEFAULT 1,
  `auto_verify_upi_utr` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `platform_settings`
INSERT IGNORE INTO `platform_settings` (`id`, `platform_name`, `support_email`, `support_phone`, `default_trial_enabled`, `default_trial_days`, `default_grace_period_days`, `auto_approve_paid_societies`, `auto_approve_trial_societies`, `reminder_days_before_expiry`, `razorpay_key_id`, `razorpay_sandbox_mode`, `welcome_email_template`, `invoice_email_template`, `overdue_email_template`, `updated_at`, `razorpay_key_secret_encrypted`, `razorpay_webhook_secret_encrypted`, `paytm_merchant_id`, `paytm_merchant_key_encrypted`, `custom_gateway_name`, `custom_gateway_api_key`, `custom_gateway_secret_encrypted`, `upi_id`, `upi_payee_name`, `bank_name`, `bank_account_number`, `bank_ifsc`, `subscription_tax_enabled`, `subscription_tax_name`, `subscription_tax_percent`, `razorpay_enabled`, `upi_payment_enabled`, `paytm_enabled`, `custom_gateway_enabled`, `meta_title`, `meta_description`, `meta_keywords`, `meta_author`, `meta_og_image`, `favicon_url`, `google_adsense_enabled`, `google_adsense_client_id`, `google_ad_slot_header`, `google_ad_slot_sidebar`, `google_ad_slot_footer`, `google_analytics_id`, `custom_header_scripts`, `logo_url`, `dark_logo_url`) VALUES ('default', 'SocietyOS Enterprise SaaS', 'superadmin@societyos.com', '+91-98765-00009', 1, 14, 7, 0, 1, 5, 'rzp_test_TpIGmZQJ7x3t3P', 0, 'Welcome to SocietyOS! Your society account is ready.', 'A new society bill has been generated for your household.', 'Reminder: Your society maintenance payment is overdue.', '2026-10-24 15:25:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'taxprofessionals97-1@okaxis', 'Kuku', NULL, NULL, NULL, 1, 'GST', 18, 1, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '/uploads/295_1792855518187_7fwhr7.webp', NULL);

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
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-admin-green-valley', 'admin@greenvalley.com', '+91-98150-11223', 'f28f77d07e8a424838b97eb0e684031f:82f76e1cbfca51280c80726a98d23e3c9fd83afab8bb865b10337cb4e982acd8a8a96e4a1483fd560be02991591bce803021381e4602a247d9cf9dcbe5cf04df', 'SOCIETY_ADMIN', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-24 16:13:49', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-admin-royal-palms', 'admin@royalpalms.com', '+91-98720-44556', '5d072983429d1c6fa59a2e9997d8f5dc:d7cea660488a2a8676d5b651596e47635a4011903625280ddbe0c130e4d2b70170d630784566f8a43328d6ffaad94eb541fb4567ea287ad93fcbe8bb895a72de', 'SOCIETY_ADMIN', 'soc-royal-palms', 1, 1, NULL, NULL, '2026-10-24 11:55:07', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-a101', 'resident@greenvalley.com', '+91-98151-10101', '44106704647001abad6340bc1b1d61ec:a055a8d1c9a69eca584bc35cb6ad20d8529a2810fe4bde29d280136fc78c0996cb41bb117cf6b4495bf7de8521115c74ab994fad222b7be722e583fa9b2d2635', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-24 15:30:45', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-a102', 'simran@greenvalley.com', '+91-98151-10102', '39b4dae9e2b6dd2888c19aa0416ee627:f7090043242b137b5d2b4e7a147a139cf6a3733fbf736ab24998dc02b1d592283f82250b87b59c60adf11d99351a84559bf41bf185109c71fd895082315a8aa6', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-b201', 'rajesh@greenvalley.com', '+91-98151-20101', '1ca00589183ac7fd9d9a3350ae9cb11d:f34133c0ed56936ac9a70ba0b426dbd098d0db0cf30a851ecdc14111999fa216d58eda981db8b8d091dcf2901798dc8dff6278ab1f5a01a1178469fa8b5ac967', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-member-rpe-a101', 'resident@royalpalms.com', '+91-98720-10101', '0a62fa9e37b00b3ec8ed87728c88de55:50c8689fec3108c6c1a65efd39fcc773e8369d29258d88b671545643cea586e9750ef1c0cc9135a7d57c1292954276d8ff5e94698b4cede726f939bcc7fbd57d', 'MEMBER', 'soc-royal-palms', 1, 1, NULL, NULL, NULL, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-staff-cashier-gvr', 'cashier@greenvalley.com', '+91-98152-33445', 'ea3d438821d6b75c9fb2b00bebc876aa:24e5e9fa37702d2d67eb1b1224e80f055ddefa1288e02531bd6e39773eef16c907fed1bc45c1d7ca0469f34a07949bd19c4d0aefea9d7cab59e8fc8fe67ff2d9', 'STAFF', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-24 10:56:55', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('user-super-admin', 'superadmin@societyos.com', '+91-98765-00001', '225e063f1311b3b121281d35819d2661:a20805c9943dc4b925d16c86f6e3d34f14f5e7203d1d7c7a18fdaa7c503d50b5f755f6d171d05dc17800eac541b037bd2d792c957f9d9ef700bf383c1aa26df9', 'SUPER_ADMIN', NULL, 1, 1, NULL, NULL, '2026-10-24 15:56:10', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('51dc56a7-6af7-41d2-8ed9-5c12580065ad', 'ram@gmail.com', '01900000', '3968b98db4f739b861200fde2a2d62bf:a59f11d5da406c0b882e21e010a008354a5ad028bc828cd767e8018dec115072130e4f8a90195a338d342962488d0098d2b0d71484a1aba0133c1f0212db4a81', 'SOCIETY_ADMIN', '1869561b-7481-4c79-90e6-5986a24fcfe6', 1, 1, NULL, NULL, NULL, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'kuku@gmail.com', '8899006655', '58a49bbe9adaa56391b507d5c61e8206:aa33224b73cdaf3bd317c387ebafbf8a0a5d3116a5f46b3505946fc2ae9d7a3b03bb81fe16994b8a5ab870e3262ae17c9f6e00749d37f1ed55404c74c26367dc', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, NULL, '2026-10-24 15:27:30', '2026-10-24 15:27:30');
INSERT IGNORE INTO `users` (`id`, `email`, `phone`, `password_hash`, `role`, `society_id`, `is_active`, `email_verified`, `reset_token_hash`, `reset_token_expires_at`, `last_login_at`, `created_at`, `updated_at`) VALUES ('6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'kuku1@gmail.com', '66788999', 'bbfc33cc9bd3ecb9b551306b619f4dae:6bda98c2d21ff307b7c40c5734df9db8167e36804b83967d24c72206a62f676edd0dd993779c5016bc19ae9e366385e1843197a5f0ef35e6c66a9c23f9e80299', 'MEMBER', 'soc-green-valley', 1, 1, NULL, NULL, '2026-10-24 15:31:47', '2026-10-24 15:28:57', '2026-10-24 15:28:57');

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
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('250ed4b5-db84-4d44-9ef8-b7f0f984e238', '51dc56a7-6af7-41d2-8ed9-5c12580065ad', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'ram', NULL, 'en', NULL, NULL, NULL, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('4cbe9721-b49c-494e-abc8-e9a4a5bc90bb', '7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'soc-green-valley', 'Kuku', NULL, 'en', '101, Block A', '', NULL, '2026-10-24 15:27:30', '2026-10-24 15:27:30');
INSERT IGNORE INTO `user_profiles` (`id`, `user_id`, `society_id`, `full_name`, `avatar_url`, `preferred_language`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES ('e76efa12-cab3-413e-89b5-b77e172d1a68', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'soc-green-valley', 'kuku', '', 'en', '101, Block-B', '', NULL, '2026-10-24 15:28:57', '2026-10-24 15:28:57');

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
  `tax_name` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subscription_plans_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `subscription_plans`
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`, `tax_name`) VALUES ('plan-annual-enterprise', 'ANNUAL_ENTERPRISE', 'Enterprise Annual RWA Suite', 'Full multi-block suite with unlimited reports, priority support & up to 1000 flats.', 'ANNUAL', 365, 19999, 18, 1000, 1, 14, 10, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37', 'GST');
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`, `tax_name`) VALUES ('plan-monthly-standard', 'MONTHLY_STARTER', 'Starter Monthly Plan', 'Ideal for small societies and apartments up to 100 flats.', 'MONTHLY', 30, 1999, 18, 100, 1, 14, 7, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37', 'GST');
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`, `tax_name`) VALUES ('plan-quarterly-growth', 'QUARTERLY_GROWTH', 'Growth Quarterly Plan', 'Complete billing, accounting, and staff portal for up to 300 flats.', 'QUARTERLY', 90, 5499, 18, 300, 1, 14, 7, 1, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37', 'GST');
INSERT IGNORE INTO `subscription_plans` (`id`, `code`, `name`, `description`, `billing_period`, `duration_days`, `price_amount`, `tax_percent`, `max_households`, `trial_enabled`, `trial_days`, `grace_period_days`, `auto_approve_after_payment`, `is_active`, `created_at`, `updated_at`, `tax_name`) VALUES ('d5019f2b-8855-4aec-abff-675c3f050f09', 'STARTUP PLAN', 'Startup Plan', '', 'CUSTOM', 13, 13, 18, 13, 1, 13, 7, 1, 1, '2026-10-24 03:54:40', '2026-10-24 03:54:40', 'GST');

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
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('481217da-9f91-4d17-86a6-dc4f17725a75', 'kuku homes', 'kuku-homes-481217', 'KUKU-5042', NULL, 'phase 6', 'Mohali', 'Punjab', '160062', 'kukuhomes@gmail.com', '66557788', '9900', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'plan-monthly-standard', 'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID', NULL, NULL, '2026-10-24T10:55:54.972Z', '2026-11-23T10:55:54.972Z', '2026-11-27T21:38:36.765Z', 0, '2026-10-21 21:38:32', '2026-10-24 10:55:54');
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('soc-green-valley', 'Green Valley Residency (Demo)', 'green-valley-residency', 'GVR-2026', NULL, 'Sector 68, Airport Road, Mohali', 'Mohali', 'Punjab', '160062', 'admin@greenvalley.com', '+91-98150-11223', 'PB-MOH-RWA-2021-089', 'user-admin-green-valley', 'plan-annual-enterprise', 'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID', NULL, NULL, '2026-09-21 11:02:37', '2027-09-21 11:02:37', NULL, 1, '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('soc-royal-palms', 'Royal Palms Enclave (Demo)', 'royal-palms-enclave', 'RPE-2026', NULL, 'Pakhowal Road, Civil Lines, Ludhiana', 'Ludhiana', 'Punjab', '141001', 'admin@royalpalms.com', '+91-98720-44556', 'PB-LDH-RWA-2024-112', 'user-admin-royal-palms', 'plan-quarterly-growth', 'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID', '2026-10-18 11:02:37', '2026-11-01 11:02:37', '2026-10-21T21:37:28.538Z', '2027-01-19T21:37:28.538Z', '2027-01-26T21:37:28.538Z', 1, '2026-10-21 11:02:37', '2026-10-21 21:37:28');
INSERT IGNORE INTO `societies` (`id`, `name`, `slug`, `enrollment_code`, `logo_url`, `address`, `city`, `state`, `pincode`, `contact_email`, `contact_phone`, `registration_number`, `admin_user_id`, `subscription_plan_id`, `subscription_status`, `approval_status`, `account_status`, `payment_status`, `trial_starts_at`, `trial_ends_at`, `subscription_starts_at`, `subscription_ends_at`, `grace_period_ends_at`, `is_demo`, `created_at`, `updated_at`) VALUES ('1869561b-7481-4c79-90e6-5986a24fcfe6', 'Ram Homes', 'ram-homes-18695', 'SOC-1403', NULL, '33, Mohali', 'Mohali', 'Punjab', '160062', 'ram@gmail.com', '01900000', NULL, '51dc56a7-6af7-41d2-8ed9-5c12580065ad', 'd5019f2b-8855-4aec-abff-675c3f050f09', 'TRIAL', 'APPROVED', 'ACTIVE', 'TRIAL', '2026-10-24T03:57:40.808Z', '2026-11-07T03:57:40.808Z', NULL, NULL, NULL, 0, '2026-10-24 03:57:40', '2026-10-24 03:57:40');

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
INSERT IGNORE INTO `society_settings` (`id`, `society_id`, `upi_enabled`, `gpay_upi_enabled`, `paytm_enabled`, `razorpay_enabled`, `bank_transfer_enabled`, `upi_id`, `upi_payee_name`, `upi_qr_url`, `bank_name`, `bank_account_number`, `bank_ifsc`, `razorpay_key_id`, `razorpay_key_secret_encrypted`, `bill_due_day`, `late_fee_amount`, `allow_member_staff_contacts`, `custom_enrollment_fields`, `email_notifications_enabled`, `sms_notifications_enabled`, `whatsapp_notifications_enabled`, `brand_primary_color`, `created_at`, `updated_at`, `razorpay_webhook_secret_encrypted`, `paytm_merchant_id`, `paytm_merchant_key_encrypted`, `custom_gateway_name`, `custom_gateway_api_key`, `custom_gateway_secret_encrypted`) VALUES ('c95fad14-4f71-46a9-bee4-606ce3c52fa5', '1869561b-7481-4c79-90e6-5986a24fcfe6', 1, 1, 1, 1, 1, 'ramhomes@hdfcbank', 'Ram Homes RWA', NULL, 'HDFC Bank Ltd', '50200089412210', 'HDFC0001245', NULL, NULL, 10, 150, 1, '[]', 1, 0, 0, '#0f766e', '2026-10-24 03:57:40', '2026-10-24 03:57:40', NULL, NULL, NULL, NULL, NULL, NULL);

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
  `receipt_url` LONGTEXT NULL,
  `notes` TEXT NULL,
  `rejection_reason` TEXT NULL,
  `refund_amount` DECIMAL(14,2) NULL,
  `refund_reference` TEXT NULL,
  `refunded_at` VARCHAR(64) NULL,
  `refund_notes` TEXT NULL,
  `refund_gateway` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_subscription_payments_society_id` (`society_id`),
  UNIQUE KEY `uk_subscription_payments_invoice` (`invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data for table `subscription_payments`
INSERT IGNORE INTO `subscription_payments` (`id`, `society_id`, `subscription_id`, `plan_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `payment_gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `verified_by_webhook`, `verified_by_user_id`, `status`, `refund_reason`, `paid_at`, `created_at`, `receipt_url`, `notes`, `rejection_reason`, `refund_amount`, `refund_reference`, `refunded_at`, `refund_notes`, `refund_gateway`) VALUES ('2ebdc2cb-0ecf-47c5-87d6-292ad618e063', 'soc-royal-palms', NULL, 'plan-quarterly-growth', 'SUB-INV-2026-18349', 5499, 989.82, 6488.82, 'RAZORPAY', 'order_da6404f4434049', 'pay_ba6aa49ef4104c', '4604f3a483192ea697c4a359b75764c0d174b16b75923808c07a502c737ffc6a', 1, NULL, 'PAID', NULL, '2026-10-21T21:37:28.538Z', '2026-10-21 21:37:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT IGNORE INTO `subscription_payments` (`id`, `society_id`, `subscription_id`, `plan_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `payment_gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `verified_by_webhook`, `verified_by_user_id`, `status`, `refund_reason`, `paid_at`, `created_at`, `receipt_url`, `notes`, `rejection_reason`, `refund_amount`, `refund_reference`, `refunded_at`, `refund_notes`, `refund_gateway`) VALUES ('36638e2f-a9c5-479f-be3f-5e9e6e54df17', '481217da-9f91-4d17-86a6-dc4f17725a75', 'e100bac9-9ebc-4a74-8373-bf2bb7335d35', 'plan-monthly-standard', 'SUB-INV-2026-73469', 1999, 359.82, 2358.82, 'RAZORPAY', 'order_80dc6ab0c6424e', 'pay_0cfcfff7ad4f46', 'b0ff5113503803e86114d401ae3cf6f44e7eb5a5158c4a51bdede3975a2024bf', 1, 'user-super-admin', 'PAID', NULL, '2026-10-24 10:55:54', '2026-10-21 21:38:32', NULL, 'Subscription payment is pending or dishonored', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT IGNORE INTO `subscription_payments` (`id`, `society_id`, `subscription_id`, `plan_id`, `invoice_number`, `amount`, `tax_amount`, `total_amount`, `payment_gateway`, `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `verified_by_webhook`, `verified_by_user_id`, `status`, `refund_reason`, `paid_at`, `created_at`, `receipt_url`, `notes`, `rejection_reason`, `refund_amount`, `refund_reference`, `refunded_at`, `refund_notes`, `refund_gateway`) VALUES ('6a8883a9-0ff8-4bb7-853f-63af6b693d84', 'soc-green-valley', 'b5871968-8172-4d67-b95a-0e61850f1d9a', 'plan-annual-enterprise', 'SUB-INV-2026-0001', 19999, 3599.82, 23598.82, 'RAZORPAY', 'order_demo_gvr_01', 'pay_demo_gvr_01', NULL, 1, NULL, 'PAID', NULL, '2026-09-21 11:02:37', '2026-10-21 11:02:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('f47815a9-8afe-4c6e-a414-da1d412ea698', '481217da-9f91-4d17-86a6-dc4f17725a75', 'Block A', 10, 'Residential Block A', '2026-10-21 21:38:32');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('f97d4db1-4801-428d-9eed-5175c8d92fb5', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Block A', 10, 'Residential Block A', '2026-10-24 03:57:40');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('d35fd15c-ee9c-4718-b93e-86cb3aa7a937', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Block B', 10, 'Residential Block B', '2026-10-24 03:57:40');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('2e7847b0-8a45-4e8b-aa64-f68f430ef126', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Block C', 10, 'Residential Block C', '2026-10-24 03:57:40');
INSERT IGNORE INTO `apartment_blocks` (`id`, `society_id`, `name`, `total_floors`, `description`, `created_at`) VALUES ('07226d56-2651-4705-8b3c-b07577cb7d29', 'soc-green-valley', 'Block-B', 10, '', '2026-10-24 15:26:57');

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
INSERT IGNORE INTO `households` (`id`, `society_id`, `block_id`, `block_name`, `floor_number`, `flat_number`, `normalized_flat_number`, `occupancy_type`, `area_sqft`, `status`, `primary_member_id`, `created_at`, `updated_at`, `opening_balance`, `opening_balance_notes`, `opening_balance_date`) VALUES ('hh-rpe-a101', 'soc-royal-palms', '4fff9a80-8f7c-4cb7-a326-3cede007842e', 'Block A', '1', 'A-101', 'A-101', 'OWNER', 1800, 'ACTIVE', 'member-rpe-a101', '2026-10-21 11:02:37', '2026-10-21 11:02:37', 0, NULL, NULL);
INSERT IGNORE INTO `households` (`id`, `society_id`, `block_id`, `block_name`, `floor_number`, `flat_number`, `normalized_flat_number`, `occupancy_type`, `area_sqft`, `status`, `primary_member_id`, `created_at`, `updated_at`, `opening_balance`, `opening_balance_notes`, `opening_balance_date`) VALUES ('5b5db1be-1840-4075-b963-6175f10146fd', 'soc-green-valley', NULL, 'Block A', '1', '101', '101', 'OWNER', 1400, 'ACTIVE', 'a900c064-2019-4d8e-8032-88a0eff85540', '2026-10-24 15:27:30', '2026-10-24 15:27:30', 2999.96, 'water charges', '2026-10-24 15:27:30');

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
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('member-rpe-a101', 'soc-royal-palms', 'hh-rpe-a101', 'user-member-rpe-a101', 'Amanpreet Singh Grewal', 'resident@royalpalms.com', '+91-98720-10101', NULL, 'PRIMARY', 1, 'OWNER', NULL, '{}', 'APPROVED', 'ACTIVE', '2026-10-21 11:02:37', '2026-10-21 11:02:37', '2026-10-21 11:02:37');
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('a900c064-2019-4d8e-8032-88a0eff85540', 'soc-green-valley', '5b5db1be-1840-4075-b963-6175f10146fd', '7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'Kuku', 'kuku@gmail.com', '8899006655', NULL, 'PRIMARY', 1, 'OWNER', '', '{}', 'APPROVED', 'ACTIVE', '2026-10-24 15:27:30', '2026-10-24 15:27:30', '2026-10-24 15:27:30');
INSERT IGNORE INTO `society_members` (`id`, `society_id`, `household_id`, `user_id`, `full_name`, `email`, `phone`, `photo_url`, `relationship_to_primary`, `is_primary_member`, `ownership_type`, `emergency_contact`, `custom_fields`, `approval_status`, `account_status`, `joined_at`, `created_at`, `updated_at`) VALUES ('9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', 'soc-green-valley', '5b5db1be-1840-4075-b963-6175f10146fd', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'kuku', 'kuku1@gmail.com', '66788999', '', 'SPOUSE', 0, 'FAMILY', '', '{}', 'APPROVED', 'ACTIVE', '2026-10-24 15:28:57', '2026-10-24 15:28:57', '2026-10-24 15:29:50');

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
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('2da4b41b-aa46-495f-963a-23ed5936fcf0', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Monthly maintenance', 'MONTHLY_MAINTENANCE', 'Monthly maintenance for society households', 2500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('32607cbf-9c83-42b6-9ff1-ab8fe358c7c1', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Water charges', 'WATER_CHARGES', 'Water charges for society households', 400, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('8c3e44c3-002b-4d20-b29c-a700c7b84ed1', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Electricity charges', 'ELECTRICITY_CHARGES', 'Electricity charges for society households', 600, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('b1a8dd99-ad55-414e-b441-016df0a6abbe', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Parking charges', 'PARKING_CHARGES', 'Parking charges for society households', 300, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('af6b1e51-bfb0-409c-9884-5174468208f6', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Security charges', 'SECURITY_CHARGES', 'Security charges for society households', 500, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('e9e4bdd9-dfd8-4d38-8742-fe13e8b3d201', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Cleaning charges', 'CLEANING_CHARGES', 'Cleaning charges for society households', 250, 'MONTHLY', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('f4e5a203-f320-4423-9879-7acdf015a43c', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Repair and maintenance', 'REPAIR_MAINTENANCE', 'Repair and maintenance for society households', 350, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('db5962b4-586d-4778-a43d-9d550f1081f6', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Late payment fees', 'LATE_PAYMENT_FEES', 'Late payment fees for society households', 150, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('cdd90a28-d07c-4a69-9b4f-6b3efffe797c', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Special assessments', 'SPECIAL_ASSESSMENTS', 'Special assessments for society households', 1000, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('17bbcc15-f03e-44cc-9bfd-42811f6bb1d4', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Other charges', 'OTHER_CHARGES', 'Other charges for society households', 200, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-24 03:57:40', '2026-10-24 03:57:40');
INSERT IGNORE INTO `charge_categories` (`id`, `society_id`, `name`, `code`, `description`, `default_amount`, `billing_frequency`, `applicable_flats`, `due_day`, `is_single_charge_per_period`, `is_active`, `created_at`, `updated_at`) VALUES ('7342266c-79bf-44f8-870b-0a223297172a', 'soc-green-valley', 'Opening Balance Dues', 'OPENING_BALANCE', 'Prior outstanding ledger balance before system onboarding', 0, 'ONE_TIME', 'ALL', 10, 1, 1, '2026-10-24 15:27:30', '2026-10-24 15:27:30');

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
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('ac7f8e91-89ec-45e3-99c3-523845f07dda', 'soc-green-valley', '5b5db1be-1840-4075-b963-6175f10146fd', 'a900c064-2019-4d8e-8032-88a0eff85540', 'OP-BAL-101-AC7F', 10, 2026, 'OPENING_BALANCE', 'OPENING_BALANCE', 'PAID', 2999.96, 0, 0, 0, 2999.96, 2999.96, 0, '2026-10-28', '2026-10-24 15:27:30', 'user-admin-green-valley', '2026-10-24 15:27:30', '2026-10-24 15:29:59');
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('5e2abfae-b9ba-458b-ac2a-68745b8d88da', 'soc-green-valley', '5b5db1be-1840-4075-b963-6175f10146fd', 'a900c064-2019-4d8e-8032-88a0eff85540', 'BILL-202610-101-5E2A', 10, 2026, 'REGULAR', NULL, 'OVERDUE', 1200, 0, 0, 0, 1200, 0, 1200, '2026-10-15', '2026-10-24T15:53:14.041Z', 'user-admin-green-valley', '2026-10-24 15:53:14', '2026-10-24 15:53:14');
INSERT IGNORE INTO `member_bills` (`id`, `society_id`, `household_id`, `member_id`, `bill_number`, `billing_month`, `billing_year`, `bill_type`, `adjustment_reason`, `status`, `subtotal_amount`, `previous_balance`, `penalty_amount`, `credit_amount`, `total_amount`, `paid_amount`, `balance_amount`, `due_date`, `issued_at`, `created_by`, `created_at`, `updated_at`) VALUES ('b9b6e3cf-b335-4d7c-bf08-1e42280d0cfa', 'soc-green-valley', '5b5db1be-1840-4075-b963-6175f10146fd', 'a900c064-2019-4d8e-8032-88a0eff85540', 'BILL-202609-101-B9B6', 9, 2026, 'REGULAR', NULL, 'OVERDUE', 1000, 0, 0, 0, 1000, 0, 1000, '2026-10-15', '2026-10-24T15:53:59.789Z', 'user-admin-green-valley', '2026-10-24 15:53:59', '2026-10-24 15:53:59');

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
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('7c70d7a9-1966-45bb-8db9-41352c5bca09', 'soc-green-valley', 'ac7f8e91-89ec-45e3-99c3-523845f07dda', '5b5db1be-1840-4075-b963-6175f10146fd', '7342266c-79bf-44f8-870b-0a223297172a', 'Opening Balance Dues', 10, 2026, 'water charges', 2999.96, 1, '2026-10-24 15:27:30');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('c75be56a-ca0f-4a69-8a43-d95a0edf64d5', 'soc-green-valley', '5e2abfae-b9ba-458b-ac2a-68745b8d88da', '5b5db1be-1840-4075-b963-6175f10146fd', 'e5235fd6-a783-4659-b664-946b576944cb', 'Cleaning charges', 10, 2026, 'Cleaning charges (10/2026)', 250, 0, '2026-10-24 15:53:14');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('5f584ff0-fca5-48fd-b7ea-98384357e4d8', 'soc-green-valley', '5e2abfae-b9ba-458b-ac2a-68745b8d88da', '5b5db1be-1840-4075-b963-6175f10146fd', 'c96565dd-b558-4e8c-894d-49c92c144ceb', 'Electricity charges', 10, 2026, 'Electricity charges (10/2026)', 600, 0, '2026-10-24 15:53:14');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('ddd69e13-23fb-4095-9c80-bb8282e20a4d', 'soc-green-valley', '5e2abfae-b9ba-458b-ac2a-68745b8d88da', '5b5db1be-1840-4075-b963-6175f10146fd', 'fa0c8df1-3064-4293-9ff4-d1f914a6a0bd', 'Late payment fees', 10, 2026, 'Late payment fees (10/2026)', 150, 0, '2026-10-24 15:53:14');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('8e320d2d-e943-43fa-ac7f-2cba81bb8e0b', 'soc-green-valley', '5e2abfae-b9ba-458b-ac2a-68745b8d88da', '5b5db1be-1840-4075-b963-6175f10146fd', '364d9c45-7186-475a-92ba-a1ee321b9ab5', 'Other charges', 10, 2026, 'Other charges (10/2026)', 200, 0, '2026-10-24 15:53:14');
INSERT IGNORE INTO `bill_items` (`id`, `society_id`, `bill_id`, `household_id`, `charge_category_id`, `category_name`, `billing_month`, `billing_year`, `description`, `amount`, `is_adjustment`, `created_at`) VALUES ('ba6049d8-dfe2-4b72-b5ab-72553dda8c67', 'soc-green-valley', 'b9b6e3cf-b335-4d7c-bf08-1e42280d0cfa', '5b5db1be-1840-4075-b963-6175f10146fd', 'ceea987e-50c4-4db5-9273-977c3ecad020', 'Special assessments', 9, 2026, 'Special assessments (9/2026)', 1000, 0, '2026-10-24 15:53:59');

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
INSERT IGNORE INTO `payments` (`id`, `society_id`, `household_id`, `member_id`, `payment_method`, `amount`, `payment_date`, `reference_number`, `proof_url`, `status`, `verification_notes`, `verified_by`, `verified_at`, `ledger_posted`, `created_at`, `updated_at`) VALUES ('08a55fc3-855b-4238-8d10-cf9f33d557f9', 'soc-green-valley', '5b5db1be-1840-4075-b963-6175f10146fd', '9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', 'UPI', 3000, '2026-10-24', '333', '', 'CONFIRMED', 'Verified and settled in society account', 'user-admin-green-valley', '2026-10-24 15:29:59', 1, '2026-10-24 15:29:30', '2026-10-24 15:29:59');

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
INSERT IGNORE INTO `payment_allocations` (`id`, `society_id`, `payment_id`, `bill_id`, `allocated_amount`, `created_at`) VALUES ('f989cae0-3868-4986-a2e5-db310d151543', 'soc-green-valley', '08a55fc3-855b-4238-8d10-cf9f33d557f9', 'ac7f8e91-89ec-45e3-99c3-523845f07dda', 2999.96, '2026-10-24 15:29:30');

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
INSERT IGNORE INTO `payment_receipts` (`id`, `society_id`, `payment_id`, `receipt_number`, `issued_to_name`, `flat_number`, `amount`, `payment_method`, `reference_number`, `issued_by`, `issued_at`) VALUES ('1dd52d24-2462-4411-bdbe-cd8359e3eeee', 'soc-green-valley', '08a55fc3-855b-4238-8d10-cf9f33d557f9', 'RCP-2026-08A55F', 'kuku', '101', 3000, 'UPI', '333', 'user-admin-green-valley', '2026-10-24 15:29:59');

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
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('719c6f54-ddc2-4388-afd3-258475b2eb65', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'President', 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('801d5e38-dcc9-496a-ae76-993246c216b6', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Vice President', 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('2be5d1de-49d5-4330-9d42-9a11c674e659', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Secretary', 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('c600b751-6904-4294-bdb1-dfe3f2a1d02e', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Joint Secretary', 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('9d39345d-b31d-4b01-a5ba-ac9fb7be3390', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Treasurer', 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('8d3ee8da-fa86-480c-9735-acdf68bb32ba', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Cashier', 0, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('5d05f38d-820d-41f7-b58f-2a7390e791fa', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Accountant', 0, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('a24e4d01-7c0c-48e5-b534-941076c71541', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Maintenance Supervisor', 0, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('78fd7ff0-6d2e-48d4-b7ca-8873b7550fb7', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Security Supervisor', 0, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('7e391391-e28f-42fe-b0fa-fc5ead98cb28', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Security Guard', 0, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('c4da982f-95ea-471a-914c-ea3ca2a6d215', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Maintenance Staff', 0, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `staff_roles` (`id`, `society_id`, `name`, `is_office_bearer`, `is_system_default`, `created_at`) VALUES ('802e2b22-f9ae-47db-8662-9fc4e05c25fd', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Office Administrator', 0, 1, '2026-10-24 03:57:40');

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
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('65cefc0d-8231-4647-bc81-370a821e4baf', '1869561b-7481-4c79-90e6-5986a24fcfe6', '719c6f54-ddc2-4388-afd3-258475b2eb65', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('3c83db78-2d3c-49ed-9858-c7648a8e0ca9', '1869561b-7481-4c79-90e6-5986a24fcfe6', '801d5e38-dcc9-496a-ae76-993246c216b6', 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('933bf5a3-66d4-420c-a7ff-b9e81e187e0d', '1869561b-7481-4c79-90e6-5986a24fcfe6', '2be5d1de-49d5-4330-9d42-9a11c674e659', 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('ef96c865-395a-42ef-a417-cd5aa563ec6b', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'c600b751-6904-4294-bdb1-dfe3f2a1d02e', 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('ab57cdd3-f2cb-43aa-92f8-d11972227ea9', '1869561b-7481-4c79-90e6-5986a24fcfe6', '9d39345d-b31d-4b01-a5ba-ac9fb7be3390', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('85f68d25-a098-429b-a4c3-40b06f2f40e6', '1869561b-7481-4c79-90e6-5986a24fcfe6', '8d3ee8da-fa86-480c-9735-acdf68bb32ba', 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('4fb5344d-6639-4f0b-abd8-81caea92017a', '1869561b-7481-4c79-90e6-5986a24fcfe6', '5d05f38d-820d-41f7-b58f-2a7390e791fa', 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('83734572-a571-4dee-9e97-65177df7e7be', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'a24e4d01-7c0c-48e5-b534-941076c71541', 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('13e78041-1015-45ba-b5dc-0380db24c24c', '1869561b-7481-4c79-90e6-5986a24fcfe6', '78fd7ff0-6d2e-48d4-b7ca-8873b7550fb7', 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('4541cb1f-91ff-4346-b764-c16350c05484', '1869561b-7481-4c79-90e6-5986a24fcfe6', '7e391391-e28f-42fe-b0fa-fc5ead98cb28', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('86e5823e-fee9-42d0-9e73-d0440fb567a6', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'c4da982f-95ea-471a-914c-ea3ca2a6d215', 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `role_permissions` (`id`, `society_id`, `role_id`, `view_members`, `manage_members`, `generate_bills`, `verify_payments`, `manage_expenses`, `view_financial_reports`, `manage_complaints`, `manage_events`, `manage_staff`, `change_society_settings`, `updated_at`) VALUES ('737490b5-c12f-4ca5-b048-4011797e3498', '1869561b-7481-4c79-90e6-5986a24fcfe6', '802e2b22-f9ae-47db-8662-9fc4e05c25fd', 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, '2026-10-24 03:57:40');

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
INSERT IGNORE INTO `complaints` (`id`, `society_id`, `complaint_number`, `household_id`, `member_id`, `flat_number`, `title`, `category`, `description`, `priority`, `status`, `assigned_staff_id`, `resolution_notes`, `resolution_image_url`, `resolved_at`, `created_at`, `updated_at`) VALUES ('84d6cebd-0bbe-41dd-a31c-187c1abb9f11', 'soc-green-valley', 'CMP-78186', '5b5db1be-1840-4075-b963-6175f10146fd', '9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', '101', 'i am not happy', 'Water supply', 'aaaaa', 'MEDIUM', 'RESOLVED', NULL, NULL, NULL, '2026-10-24 15:54:44', '2026-10-24 15:32:31', '2026-10-24 15:54:50');

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

-- Seed data for table `complaint_attachments`
INSERT IGNORE INTO `complaint_attachments` (`id`, `society_id`, `complaint_id`, `file_url`, `file_type`, `uploaded_by`, `created_at`) VALUES ('31499ecf-da1b-44e0-bd07-a08a2daf3b8e', 'soc-green-valley', '84d6cebd-0bbe-41dd-a31c-187c1abb9f11', '/uploads/Untitleddesign14_1792855949326_2k54g9.png', 'image/png', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', '2026-10-24 15:32:31');

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
INSERT IGNORE INTO `complaint_comments` (`id`, `society_id`, `complaint_id`, `author_user_id`, `author_name`, `comment_text`, `is_internal`, `created_at`) VALUES ('190b748f-d05c-4366-b8e7-b30d6a04b296', 'soc-green-valley', '84d6cebd-0bbe-41dd-a31c-187c1abb9f11', 'user-admin-green-valley', 'Harpreet Singh Gill (RWA President)', 'done', 0, '2026-10-24 15:54:50');

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
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('9efd7af2-c454-4cad-b593-4fedd782a7b9', 'soc-green-valley', 'CASH', 'Society Petty Cash Account', 0, 0, '2026-10-23 20:10:40');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('c70304f1-5e64-4a88-a29d-0649e18e2ce5', 'soc-green-valley', 'BANK', 'Society Main RWA Bank Account', 0, 3000, '2026-10-24 15:29:59');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('fda38a09-09c4-4b5b-adf2-c4af07d93cca', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'CASH', 'Society Petty Cash Account', 0, 0, '2026-10-24 03:57:40');
INSERT IGNORE INTO `financial_accounts` (`id`, `society_id`, `account_type`, `account_name`, `opening_balance`, `current_balance`, `updated_at`) VALUES ('370abb24-251c-4d5b-9fd1-1eabe8c5981e', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'BANK', 'Society Main RWA Bank Account', 0, 0, '2026-10-24 03:57:40');

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
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('69ba0631-c25d-4b34-b570-ababc96ec38e', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Security Services & Guards', 'Standard expense head: Security Services & Guards', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('b98ce19d-cb63-463a-9078-91890473c26d', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Housekeeping & Sanitation', 'Standard expense head: Housekeeping & Sanitation', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('13ce968d-16a6-497d-b3b7-0543cc8badc5', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Common Area Electricity Bill', 'Standard expense head: Common Area Electricity Bill', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('bddc027d-32e7-456e-a5b4-9cf94632c71e', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Water Tanker & Pump Repair', 'Standard expense head: Water Tanker & Pump Repair', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('9a76629e-2896-40bc-8537-ba85cf47d555', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Lift AMC & Maintenance', 'Standard expense head: Lift AMC & Maintenance', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('ccc3faa4-c8f9-4e8a-b300-2a915d1d4d0a', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Garden & Landscaping', 'Standard expense head: Garden & Landscaping', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('8df8b996-b665-465f-9514-a0808301b08c', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Diesel for Generator', 'Standard expense head: Diesel for Generator', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('626c0dd1-092f-4f18-a5d4-3e04a1923de0', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Office Stationery & Admin', 'Standard expense head: Office Stationery & Admin', 1, '2026-10-24 03:57:40');
INSERT IGNORE INTO `expense_categories` (`id`, `society_id`, `name`, `description`, `is_active`, `created_at`) VALUES ('7b082cea-3121-4592-a63c-fdedd80e2f46', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'Festival & Community Events', 'Standard expense head: Festival & Community Events', 1, '2026-10-24 03:57:40');

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
INSERT IGNORE INTO `ledger_entries` (`id`, `society_id`, `transaction_code`, `entry_date`, `entry_type`, `account_type`, `category`, `description`, `amount`, `direction`, `reference_type`, `reference_id`, `household_id`, `flat_number`, `member_id`, `payment_method`, `reversal_of_entry_id`, `created_by`, `created_at`) VALUES ('432bfc51-0426-46d2-8b83-cb81812100d3', 'soc-green-valley', 'TXN-INC-1792855799911-08A5', '2026-10-24', 'INCOME', 'BANK', 'Maintenance Collection', 'Confirmed payment RCP-2026-08A55F (Flat 101, Ref: 333)', 3000, 'CREDIT', 'PAYMENT', '08a55fc3-855b-4238-8d10-cf9f33d557f9', '5b5db1be-1840-4075-b963-6175f10146fd', '101', '9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', 'UPI', NULL, 'user-admin-green-valley', '2026-10-24 15:29:59');

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
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('463d2d38-7b52-48d9-a111-d3a94292c8c3', 'soc-royal-palms', 'user-admin-royal-palms', 'TRIAL_EXPIRY', 'Free Trial Expiring in 11 Day(s)', 'Your Royal Palms Enclave (Demo) plan expires on 2026-11-01. Renew now for uninterrupted access.', 'EMAIL', 'sub-exp:soc-royal-palms:2026-11-01', 1, '2026-10-21 21:32:39');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('90d7dab9-63b8-4b9c-90ca-dc08a87e2041', '481217da-9f91-4d17-86a6-dc4f17725a75', NULL, 'SUBSCRIPTION_PAYMENT_CONFIRMED', 'Subscription Renewed & Active — Starter Monthly Plan', 'Subscription payment of ₹2,358.82 (Ref: pay_0cfcfff7ad4f46) is verified. Your society subscription is ACTIVE until 20/11/2026.', 'IN_APP', NULL, 0, '2026-10-21 21:38:36');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('92c5075d-3e95-4128-b082-eda476d4dd6d', 'soc-royal-palms', 'user-admin-royal-palms', 'SUBSCRIPTION_PAYMENT_DUE', 'Subscription Payment Due for Approval — Growth Quarterly Plan (₹6,488.82)', 'Super Admin Notice: Your society free trial is ending in 11 days. Please complete your subscription payment of ₹6,488.82 (₹5,499 + 18% GST) for continued active approval and uninterrupted portal access.', 'IN_APP', 'seed:sub-due:soc-royal-palms', 1, '2026-10-21 11:02:37');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('a2d32fb7-a2cf-4e32-8335-6cc54bf39776', '481217da-9f91-4d17-86a6-dc4f17725a75', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'SOCIETY_REGISTERED', 'Society Registration Created — Complete Subscription Payment', 'Please complete your subscription payment to activate kuku homes.', 'EMAIL', 'soc-reg:481217da-9f91-4d17-86a6-dc4f17725a75', 0, '2026-10-21 21:38:32');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('afd37a00-248d-437b-9b44-e052ad08f21a', '481217da-9f91-4d17-86a6-dc4f17725a75', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'SUBSCRIPTION_RENEWAL', 'Subscription Expiring in 30 Day(s)', 'Your kuku homes plan expires on 2026-11-20. Renew now for uninterrupted access.', 'EMAIL', 'sub-exp:481217da-9f91-4d17-86a6-dc4f17725a75:2026-11-20', 0, '2026-10-21 21:41:49');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('f3c791a0-4aa2-4cb7-988f-07640a6df86c', 'soc-royal-palms', NULL, 'SUBSCRIPTION_PAYMENT_CONFIRMED', 'Subscription Renewed & Active — Growth Quarterly Plan', 'Subscription payment of ₹6,488.82 (Ref: pay_ba6aa49ef4104c) is verified. Your society subscription is ACTIVE until 19/1/2027.', 'IN_APP', NULL, 0, '2026-10-21 21:37:28');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('731c2610-1072-449f-bf47-df984bee9d15', 'soc-green-valley', 'user-admin-green-valley', 'SUBSCRIPTION_PAYMENT_CONFIRMED', 'Enterprise Annual Subscription Active & Verified', 'Super Admin Notice: Your Enterprise Annual RWA Suite subscription is active and fully approved. Next renewal is scheduled in 335 days.', 'IN_APP', 'seed:sub-active:soc-green-valley', 1, '2026-10-24 03:51:59');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('6f027764-0763-48d3-b8d5-d14ed4c7fc68', '1869561b-7481-4c79-90e6-5986a24fcfe6', '51dc56a7-6af7-41d2-8ed9-5c12580065ad', 'TRIAL_EXPIRY', 'Free Trial Expiring in 14 Day(s)', 'Your Ram Homes plan expires on 2026-11-07. Renew now for uninterrupted access.', 'EMAIL', 'sub-exp:1869561b-7481-4c79-90e6-5986a24fcfe6:2026-11-07', 0, '2026-10-24 04:01:59');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('96580722-565d-433e-b25c-edcac107b11e', '481217da-9f91-4d17-86a6-dc4f17725a75', '94e7a8da-927d-49da-b02f-f6e661a7c790', 'SUBSCRIPTION_RENEWAL', 'Subscription Expiring in 30 Day(s)', 'Your kuku homes plan expires on 2026-11-23. Renew now for uninterrupted access.', 'EMAIL', 'sub-exp:481217da-9f91-4d17-86a6-dc4f17725a75:2026-11-23', 0, '2026-10-24 10:59:18');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('15dd3627-04d7-41e1-884a-af48b66e419a', 'soc-green-valley', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'NEW_MEMBER_ENROLMENT', 'Enrolment Received — Flat 101', 'kuku enrolled for Flat 101 in Green Valley Residency (Demo).', 'IN_APP', 'enroll:9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', 1, '2026-10-24 15:28:57');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('29908d30-c6f1-4438-9b3c-29d363809e8e', 'soc-green-valley', NULL, 'PAYMENT_SUBMITTED', 'Payment Submitted — Flat 101', 'kuku (101) submitted ₹3000 via UPI (Ref: 333) for verification.', 'IN_APP', 'pay-sub:08a55fc3-855b-4238-8d10-cf9f33d557f9', 1, '2026-10-24 15:29:30');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('9df24adc-5183-4085-80a7-7b2631b3b6fa', 'soc-green-valley', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'ENROLMENT_APPROVED', 'Your Society Enrolment is Approved', 'Welcome! Your society membership has been approved by the administrator.', 'IN_APP', NULL, 1, '2026-10-24 15:29:50');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('67afad38-bf72-4761-862e-870f44aa0b81', 'soc-green-valley', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'PAYMENT_CONFIRMED', 'Payment Confirmed — Receipt RCP-2026-08A55F', 'Your payment of ₹3000 has been verified and confirmed. Receipt #RCP-2026-08A55F is now available for download.', 'EMAIL', 'pay-conf:08a55fc3-855b-4238-8d10-cf9f33d557f9', 1, '2026-10-24 15:29:59');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('a2c1563f-f974-4d0a-88da-ba8fa535a9f8', 'soc-green-valley', NULL, 'NEW_COMPLAINT', 'New Complaint CMP-78186 (101)', 'kuku reported [Water supply]: i am not happy ', 'IN_APP', 'cmp:84d6cebd-0bbe-41dd-a31c-187c1abb9f11', 1, '2026-10-24 15:32:31');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('9d11f9b4-95b0-498f-945f-2d22ec3ed9bf', 'soc-green-valley', '7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'NEW_MONTHLY_BILL', 'New Monthly Bill Issued: BILL-202610-101-5E2A', 'Your society bill for 10/2026 of ₹1200 is due by 2026-10-15.', 'EMAIL', 'bill-issued:5e2abfae-b9ba-458b-ac2a-68745b8d88da', 1, '2026-10-24 15:53:14');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('b734649b-27e0-48dd-9084-4926e7da98bd', 'soc-green-valley', '7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'NEW_MONTHLY_BILL', 'New Monthly Bill Issued: BILL-202609-101-B9B6', 'Your society bill for 9/2026 of ₹1000 is due by 2026-10-15.', 'EMAIL', 'bill-issued:b9b6e3cf-b335-4d7c-bf08-1e42280d0cfa', 1, '2026-10-24 15:53:59');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('5a312443-7c80-4ca9-ab71-de467fe87ef3', 'soc-green-valley', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'COMPLAINT_STATUS_CHANGED', 'Complaint CMP-78186 Status: RESOLVED', 'Your complaint "i am not happy" has been updated to RESOLVED.', 'IN_APP', NULL, 1, '2026-10-24 15:54:44');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('7954016e-9ba2-4242-8be5-485682c08eae', 'soc-green-valley', '7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'OVERDUE_PAYMENT', 'Overdue Bill Reminder: BILL-202610-101-5E2A', 'Your society bill BILL-202610-101-5E2A of ₹1200 was due on 2026-10-15. Please submit payment to avoid late fees.', 'EMAIL', 'overdue:5e2abfae-b9ba-458b-ac2a-68745b8d88da:2026-10-24', 1, '2026-10-24 15:56:33');
INSERT IGNORE INTO `notifications` (`id`, `society_id`, `user_id`, `notification_type`, `title`, `message`, `channel`, `dedup_key`, `is_read`, `created_at`) VALUES ('76c79199-d24c-4772-879d-955b4d8cd701', 'soc-green-valley', '7491c94e-de44-410d-b2b4-3e26d8c62b7a', 'OVERDUE_PAYMENT', 'Overdue Bill Reminder: BILL-202609-101-B9B6', 'Your society bill BILL-202609-101-B9B6 of ₹1000 was due on 2026-10-15. Please submit payment to avoid late fees.', 'EMAIL', 'overdue:b9b6e3cf-b335-4d7c-bf08-1e42280d0cfa:2026-10-24', 1, '2026-10-24 15:56:33');

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
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('a60a8800-2f79-4fcd-9755-2dd9c5148fed', 'soc-green-valley', 'user-admin-green-valley', 'SOCIETY_ADMIN', 'RESET_TO_ZERO', 'SOCIETY', 'soc-green-valley', 'Society database reset to zero by admin', NULL, '2026-10-23 20:10:40');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('cff63c66-ff30-432d-bd20-50341fb5718e', NULL, 'user-super-admin', 'SUPER_ADMIN', 'CREATED_SUBSCRIPTION_PLAN', 'SUBSCRIPTION_PLAN', 'd5019f2b-8855-4aec-abff-675c3f050f09', '{"code":"Startup Plan","name":"Startup Plan","priceAmount":13}', NULL, '2026-10-24 03:54:40');

-- --------------------------------------------------------
-- Table structure for table `webhook_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` VARCHAR(64) NOT NULL,
  `event` VARCHAR(64) NOT NULL,
  `url` TEXT NOT NULL,
  `status_code` INT NULL,
  `response_body` TEXT NULL,
  `success` INT NOT NULL DEFAULT 0,
  `payload` LONGTEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('4e8c3ef6-c003-4a55-86a3-0d66e497bd81', NULL, 'user-super-admin', 'SUPER_ADMIN', 'UPDATED_PLATFORM_SETTINGS', 'PLATFORM_SETTINGS', 'default', '{}', NULL, '2026-10-24 03:55:29');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('97fd549a-e214-4715-a48f-575cf9f820cd', NULL, 'user-super-admin', 'SUPER_ADMIN', 'UPDATED_PLATFORM_SETTINGS', 'PLATFORM_SETTINGS', 'default', '{}', NULL, '2026-10-24 03:56:25');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('b0eee27b-c4db-4d7d-938d-57d719fb6274', '1869561b-7481-4c79-90e6-5986a24fcfe6', 'user-super-admin', 'SUPER_ADMIN', 'SUPER_ADMIN_CREATED_SOCIETY', 'SOCIETY', '1869561b-7481-4c79-90e6-5986a24fcfe6', '{"societyName":"Ram Homes","email":"ram@gmail.com"}', NULL, '2026-10-24 03:57:40');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('4fd19157-954c-4594-8e7c-01ef059fc060', '481217da-9f91-4d17-86a6-dc4f17725a75', 'user-super-admin', 'SUPER_ADMIN', 'SUBSCRIPTION_PAYMENT_REFUNDED', 'SUBSCRIPTION_PAYMENT', '36638e2f-a9c5-479f-be3f-5e9e6e54df17', '{"reason":"Requested by society administrator"}', NULL, '2026-10-24 04:02:30');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('0b39b2a8-2543-4a26-a03f-ee6516e49cf8', '481217da-9f91-4d17-86a6-dc4f17725a75', 'user-super-admin', 'SUPER_ADMIN', 'SUBSCRIPTION_PAYMENT_AUTO_VERIFIED', 'SUBSCRIPTION_PAYMENT', '36638e2f-a9c5-479f-be3f-5e9e6e54df17', '{}', NULL, '2026-10-24 10:55:54');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('ea247d89-fb59-4ca9-9bab-b52198b3c49d', NULL, 'user-super-admin', 'SUPER_ADMIN', 'UPDATED_PLATFORM_SETTINGS', 'PLATFORM_SETTINGS', 'default', '{}', NULL, '2026-10-24 15:25:29');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('8918d0df-c98d-4c48-a5e3-4f91a4ddaa89', 'soc-green-valley', 'user-admin-green-valley', 'SOCIETY_ADMIN', 'MEMBER_CREATED', 'SOCIETY_MEMBER', 'a900c064-2019-4d8e-8032-88a0eff85540', '{"flatNumber":"101","fullName":"Kuku","enrolmentMode":"NEW_HOUSEHOLD"}', NULL, '2026-10-24 15:27:30');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('e6f445f9-7cba-496e-8690-3ba59deca574', 'soc-green-valley', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'MEMBER', 'PUBLIC_MEMBER_ENROLLED', 'SOCIETY_MEMBER', '9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', '{"flatNumber":"101","enrolmentMode":"FAMILY_MEMBER"}', '127.0.0.1', '2026-10-24 15:28:57');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('db906600-a1fb-43ff-b351-a818b327660c', 'soc-green-valley', '6368cfe0-60bf-4132-b0c6-3fa9b9a29e1a', 'MEMBER', 'MEMBER_SUBMITTED_PAYMENT', 'PAYMENT', '08a55fc3-855b-4238-8d10-cf9f33d557f9', '{"amount":3000,"paymentMethod":"UPI","referenceNumber":"333","billIds":["ac7f8e91-89ec-45e3-99c3-523845f07dda"]}', NULL, '2026-10-24 15:29:30');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('fa5318e5-6bb0-4da7-ad11-5bff7e5a3d9f', 'soc-green-valley', 'user-admin-green-valley', 'SOCIETY_ADMIN', 'MEMBER_APPROVE', 'SOCIETY_MEMBER', '9b413c2c-50bd-4a0a-ae3f-c5c46735ace2', '{}', NULL, '2026-10-24 15:29:50');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('6eaff87c-2f9d-46a4-b40a-756593374ec0', 'soc-green-valley', 'user-admin-green-valley', 'SOCIETY_ADMIN', 'PAYMENT_CONFIRMED', 'PAYMENT', '08a55fc3-855b-4238-8d10-cf9f33d557f9', '{"receiptNumber":"RCP-2026-08A55F","amount":3000,"accountType":"BANK"}', NULL, '2026-10-24 15:29:59');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('4360cb9c-cdc6-4f9a-b2ad-41caba60d964', 'soc-green-valley', 'user-admin-green-valley', 'SOCIETY_ADMIN', 'BILLS_GENERATED', 'MEMBER_BILL', NULL, '{"billingMonth":10,"billingYear":2026,"createdCount":1,"skippedDuplicates":[]}', NULL, '2026-10-24 15:53:14');
INSERT IGNORE INTO `audit_logs` (`id`, `society_id`, `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES ('de6b1b38-db41-439e-b61d-802fda2131a8', 'soc-green-valley', 'user-admin-green-valley', 'SOCIETY_ADMIN', 'BILLS_GENERATED', 'MEMBER_BILL', NULL, '{"billingMonth":9,"billingYear":2026,"createdCount":1,"skippedDuplicates":[]}', NULL, '2026-10-24 15:53:59');

SET FOREIGN_KEY_CHECKS = 1;
