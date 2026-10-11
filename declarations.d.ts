declare module '*.css';

// Drizzle-Migrationen, per babel-plugin-inline-import als Text eingebettet
declare module '*.sql' {
  const content: string;
  export default content;
}
