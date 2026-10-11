CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`is_system` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_unique` ON `category` (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `category_single_system` ON `category` (`is_system`) WHERE "category"."is_system" = 1;--> statement-breakpoint
CREATE TABLE `list` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'green' NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `list_last_used_at_idx` ON `list` (`last_used_at`);--> statement-breakpoint
CREATE TABLE `list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`note` text,
	`checked` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`list_id`) REFERENCES `list`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `list_item_list_id_idx` ON `list_item` (`list_id`);--> statement-breakpoint
CREATE INDEX `list_item_product_id_idx` ON `list_item` (`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `list_item_list_product_unique` ON `list_item` (`list_id`,`product_id`) WHERE "list_item"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_id` text NOT NULL,
	`last_quantity` real,
	`last_unit` text,
	`last_used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_name_unique` ON `product` (lower("name"));--> statement-breakpoint
CREATE INDEX `product_category_id_idx` ON `product` (`category_id`);--> statement-breakpoint
CREATE INDEX `product_last_used_at_idx` ON `product` (`last_used_at`);--> statement-breakpoint
CREATE TABLE `product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`file_name` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_image_product_id_idx` ON `product_image` (`product_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transfer_history` (
	`id` text PRIMARY KEY NOT NULL,
	`direction` text NOT NULL,
	`list_id` text NOT NULL,
	`list_name` text NOT NULL,
	`peer_name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transfer_history_created_at_idx` ON `transfer_history` (`created_at`);