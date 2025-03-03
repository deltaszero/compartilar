# CompartiLar

[![wakatime](https://wakatime.com/badge/user/018d43b8-0657-4341-8350-d2bec44cda7a/project/f920cf64-ad85-41bc-bd1e-e49e03f30ece.svg)](https://wakatime.com/badge/user/018d43b8-0657-4341-8350-d2bec44cda7a/project/f920cf64-ad85-41bc-bd1e-e49e03f30ece)

```sh
firebase deploy --only firestore
```

# Temporary Issues

```info
npx shadcn@latest add alert avatar badge button card checkbox dropdown-menu form  input label navigation-menu radio-group select separator sheet skeleton table tabs textarea dialog --overwrite

input-with-icon
spinner
```

```error
Failed to compile.


./app/(user)/[username]/calendario/components/Calendar.tsx
29:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
30:10  Error: 'loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
221:9  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop

./app/(user)/[username]/calendario/components/DayEvents.tsx
7:3  Error: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
8:3  Error: 'CardTitle' is defined but never used.  @typescript-eslint/no-unused-vars
9:3  Error: 'CardFooter' is defined but never used.  @typescript-eslint/no-unused-vars
22:42  Error: 'CalendarEventWithChild' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/calendario/components/types.ts
3:10  Error: 'Timestamp' is defined but never used.  @typescript-eslint/no-unused-vars

./app/components/logged-area/calendar/Calendar.tsx
87:6  Warning: React Hook useEffect has missing dependencies: 'loadChildren' and 'loadCoParentingRelationships'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
94:6  Warning: React Hook useEffect has a missing dependency: 'loadEvents'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
143:6  Warning: React Hook useEffect has a missing dependency: 'getEventsForDay'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
303:27  Error: '_' is assigned a value but never used.  @typescript-eslint/no-unused-vars
332:27  Error: '_' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./app/components/logged-area/friendship/FriendRequests.tsx
21:8  Warning: React Hook useEffect has a missing dependency: 'loadFriendRequests'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./app/convite/[id]/page.tsx
4:8  Error: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
26:9  Error: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
103:47  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
103:68  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

./app/lib/analyticsService.ts
49:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
```