Thanks! I’ll look into how to resolve the Next.js 15.1.7 type error related to the `GET` function in your route file when deploying with Firebase Hosting. I’ll focus on how to properly structure API routes using the new App Router and ensure compatibility with Firebase’s current support.

I’ll get back to you shortly with steps to fix the type error and successfully deploy.

# Next.js 15 App Router API Routes on Firebase Hosting

## Fixing the "Invalid GET Export" Type Error in Next.js 15

Next.js 15 introduced **asynchronous route parameters**, meaning the `params` in App Router contexts are now delivered as a Promise. In your API Route (`app/api/.../route.ts`), the second argument of the handler should be typed accordingly. The build error: 

```
Type '{ params: { id: string; }; }' is not a valid type for the function's second argument.
``` 

occurs because the context was typed as a plain object instead of a Promise. According to the Next.js 15 documentation, `context.params` is now a **promise that resolves to the dynamic route params** ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=,parameters%20for%20the%20current%20route)) ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=Version%20Changes%20%60v15.0.0,Route%20Handlers%20are%20introduced)). 

**Solution:** Update your function signature to reflect an asynchronous `params`. For example, in a dynamic route `[id]` handler:

```ts
// Before (incorrect in Next.js 15)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // ... 
}

// After (Next.js 15+ correct signature)
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Await the params promise to get the id
  // ... your logic ...
  return new Response(`Changelog for item ${id}`); // return a Response/NextResponse
}
```

In the above, the second argument `context` is typed as `{ params: Promise<{ id: string }> }`. We then use `await params` to retrieve the actual `id` value ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=export%20async%20function%20GET,%3D%20await%20params)). This aligns with Next.js 15’s **App Router convention** for dynamic route handlers and resolves the type error.

## API Route Handler Signature and Firebase Hosting Compatibility

When deploying to Firebase Hosting (with Cloud Functions serving SSR/API routes), you should use the **standard Next.js App Router handler format**. The handler is an exported async function named after the HTTP method (`GET`, `POST`, etc.) that accepts a `Request` object and an optional context object with `params`. The return value should be a `Response` (or `NextResponse`). The introduction of asynchronous `params` doesn’t change how Firebase calls your function; it only affects your TypeScript types and how you extract the parameters.

**Firebase Hosting support for Next.js App Router:** Keep in mind that Firebase’s integration with Next.js App Router has been in **public preview**. Official Firebase documentation (as of early preview) listed support up to Next.js 13.4.7 ([Integrate Next.js  |  Firebase Hosting](https://firebase.google.com/docs/hosting/frameworks/nextjs#:~:text=Using%20the%20Firebase%20CLI%2C%20you,7)). In practice, support has improved over time. In fact, Firebase CLI v13.24 (late 2024) **added official support for Next.js 15** ([Firebase CLI Release Notes](https://firebase.google.com/support/release-notes/cli#:~:text=Version%2013.24.0%20,2024)). If you’re using Next 15.1.7, ensure your Firebase CLI is up to date. Earlier versions of the App Router had known issues on Firebase Hosting’s preview – for example, one GitHub issue noted that only Next 13.4.12 fully worked for API GET routes, while newer versions threw errors ([NextJS API Routes not working with Firebase Hosting · Issue #6308 · firebase/firebase-tools · GitHub](https://github.com/firebase/firebase-tools/issues/6308#:~:text=%40ritvij14%2C%20yes%20it%20is%20the,500%20errors%20on%20all%20requests)). With the updated CLI and Next 15 support, these issues have been addressed.

**In summary:** Use the correct Next.js 15 function signature for API routes (with `params` as a Promise in the context argument) and update your Firebase tools to the latest preview support. This will resolve the TypeScript error and ensure your Next.js App Router API endpoints work properly on Firebase Hosting.

**Example – Dynamic API Route (`app/api/parental-plan/[id]/changelog/route.ts`):**

```ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Fetch or compute the changelog for the given id...
  return NextResponse.json({ ok: true, changelog: `Changelog data for ${id}` });
}
```

This handler will compile without type errors. It follows Next.js 15’s async params convention ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=,parameters%20for%20the%20current%20route)) ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=export%20async%20function%20GET,%3D%20await%20params)), and is compatible with Firebase’s Next.js Hosting preview (which treats it like any other Next API route). Always refer to the Next.js docs and Firebase release notes for the latest updates on support and conventions when deploying to Firebase Hosting. 

**References:**

- Next.js 15 App Router Documentation – Route Handler Parameters ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=,parameters%20for%20the%20current%20route)) ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=export%20async%20function%20GET,%3D%20await%20params))  
- Next.js 15 Release Notes – Async Request APIs (breaking change for `context.params`) ([File Conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route#parameters#:~:text=Version%20Changes%20%60v15.0.0,Route%20Handlers%20are%20introduced))  
- Firebase Hosting Frameworks Preview – Next.js support (public preview and version support) ([Integrate Next.js  |  Firebase Hosting](https://firebase.google.com/docs/hosting/frameworks/nextjs#:~:text=Using%20the%20Firebase%20CLI%2C%20you,7)) ([Integrate Next.js  |  Firebase Hosting](https://firebase.google.com/docs/hosting/frameworks/nextjs#:~:text=Note%3A%20Framework,along%20with%20improved%20GitHub%20integration))  
- Firebase CLI Release Notes – Added support for Next.js 15 (ensure CLI is updated) ([Firebase CLI Release Notes](https://firebase.google.com/support/release-notes/cli#:~:text=Version%2013.24.0%20,2024))  
- Firebase/Next.js GitHub Issue – App Router API routes on Firebase (early compatibility notes)