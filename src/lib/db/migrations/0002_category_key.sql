ALTER TABLE `category` ADD `key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `category_key_unique` ON `category` (`key`);--> statement-breakpoint
-- Von Hand ergänzt: Schlüssel für vorhandene Standard-Kategorien (Namen aus seed.categories in de/en).
-- Je Schlüssel höchstens eine Kategorie (Unique-Index), umbenannte bleiben ohne Schlüssel.
UPDATE `category` SET `key` = 'other' WHERE `is_system` = 1;--> statement-breakpoint
UPDATE `category` SET `key` = 'produce' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Obst & Gemüse', 'Fruit & veg') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'bakery' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Backwaren', 'Bakery') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'chilled' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Kühlregal', 'Chilled') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'meatFish' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Fleisch & Fisch', 'Meat & fish') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'frozen' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Tiefkühl', 'Frozen') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'drinks' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Getränke', 'Drinks') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'drugstore' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Drogerie', 'Toiletries') ORDER BY `sort_order` LIMIT 1);--> statement-breakpoint
UPDATE `category` SET `key` = 'household' WHERE `id` = (SELECT `id` FROM `category` WHERE `is_system` = 0 AND `key` IS NULL AND `name` IN ('Haushalt', 'Household') ORDER BY `sort_order` LIMIT 1);
