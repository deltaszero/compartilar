dusoudeth@u22:~/Documentos/github/compartilar$ firebase deploy
No Firebase app associated with site compartilar-firebase-app, injecting project default config.
  You can link a Web app to a Hosting site here https://console.firebase.google.com/project/compartilar-firebase-app/settings/general/web

   Thank you for trying our early preview of Next.js support on Firebase Hosting.
   During the preview, support is best-effort and breaking changes can be expected. Proceed with caution.
   The integration is known to work with Next.js version 12 - 15.0. You may encounter errors.

   Documentation: https://firebase.google.com/docs/hosting/frameworks/nextjs
   File a bug: https://github.com/firebase/firebase-tools/issues/new?template=bug_report.md
   Submit a feature request: https://github.com/firebase/firebase-tools/issues/new?template=feature_request.md

   We'd love to learn from you. Express your interest in helping us shape the future of Firebase Hosting: https://goo.gle/41enW5X

   ▲ Next.js 15.1.7

   - Environments: .env.local


   Creating an optimized production build ...

 ✓ Compiled successfully

   Skipping linting

   Checking validity of types ...

   Collecting page data ...

   Generating static pages (0/38) ...

   Generating static pages (9/38) 

   Generating static pages (18/38) 

 ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/login/reset-password/action". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
    at a (/home/dusoudeth/Documentos/github/compartilar/.next/server/chunks/6456.js:1:4353)
    at f (/home/dusoudeth/Documentos/github/compartilar/.next/server/chunks/6456.js:1:20949)
    at N (/home/dusoudeth/Documentos/github/compartilar/.next/server/app/(auth)/login/reset-password/action/page.js:1:5885)
    at nO (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:45959)
    at nI (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:47734)
    at nL (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:65533)
    at nN (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:63164)
    at n$ (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:46311)
    at nI (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:47780)
    at nI (/home/dusoudeth/Documentos/github/compartilar/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:62515)
Error occurred prerendering page "/login/reset-password/action". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /(auth)/login/reset-password/action/page: /login/reset-password/action, exiting the build.

 ⨯ Next.js build worker exited with code: 1 and signal: null


Error: An unexpected error has occurred.