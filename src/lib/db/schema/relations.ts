import { relations } from "drizzle-orm";

import { category } from "./category";
import { list } from "./list";
import { listItem } from "./list-item";
import { product, productImage } from "./product";
import { recipe } from "./recipe";

export const listRelations = relations(list, ({ one, many }) => ({
  items: many(listItem),
  recipe: one(recipe, { fields: [list.recipeId], references: [recipe.id] }),
}));

export const recipeRelations = relations(recipe, ({ many }) => ({
  lists: many(list),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, { fields: [product.categoryId], references: [category.id] }),
  images: many(productImage),
  listItems: many(listItem),
}));

export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, { fields: [productImage.productId], references: [product.id] }),
}));

export const listItemRelations = relations(listItem, ({ one }) => ({
  list: one(list, { fields: [listItem.listId], references: [list.id] }),
  product: one(product, { fields: [listItem.productId], references: [product.id] }),
}));
