CREATE TABLE `recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`servings` text,
	`ingredients` text NOT NULL,
	`instructions` text NOT NULL,
	`calories` real,
	`protein` real,
	`carbs` real,
	`fat` real,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
-- ON DELETE von Hand ergänzt: drizzle-kit lässt es bei ALTER TABLE … ADD weg (Schema: set null)
ALTER TABLE `list` ADD `recipe_id` text REFERENCES recipe(id) ON DELETE set null;--> statement-breakpoint
CREATE INDEX `list_recipe_id_idx` ON `list` (`recipe_id`);