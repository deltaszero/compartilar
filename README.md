```sh
npx shadcn@latest add https://neobrutalism.dev/r/button.json
npx shadcn@latest add https://neobrutalism.dev/r/sheet.json
npx shadcn@latest add https://neobrutalism.dev/r/menubar.json


npx shadcn@latest add https://neobrutalism.dev/r/alert.json ;
npx shadcn@latest add https://neobrutalism.dev/r/avatar.json ;
npx shadcn@latest add https://neobrutalism.dev/r/badge.json ;
npx shadcn@latest add https://neobrutalism.dev/r/button.json ;
npx shadcn@latest add https://neobrutalism.dev/r/card.json ;
npx shadcn@latest add https://neobrutalism.dev/r/checkbox.json ;
npx shadcn@latest add https://neobrutalism.dev/r/dropdown-menu.json ;
npx shadcn@latest add https://neobrutalism.dev/r/form.json ;
npx shadcn@latest add https://neobrutalism.dev/r/input.json ;
npx shadcn@latest add https://neobrutalism.dev/r/label.json ;
npx shadcn@latest add https://neobrutalism.dev/r/navigation-menu.json ;
npx shadcn@latest add https://neobrutalism.dev/r/radio-group.json ;
npx shadcn@latest add https://neobrutalism.dev/r/select.json ;
npx shadcn@latest add https://neobrutalism.dev/r/separator.json ;
npx shadcn@latest add https://neobrutalism.dev/r/sheet.json ;
npx shadcn@latest add https://neobrutalism.dev/r/skeleton.json ;
npx shadcn@latest add https://neobrutalism.dev/r/table.json ;
npx shadcn@latest add https://neobrutalism.dev/r/tabs.json ;
npx shadcn@latest add https://neobrutalism.dev/r/textarea.json ;
npx shadcn@latest add https://neobrutalism.dev/r/dialog.json ;

npx shadcn@latest add https://neobrutalism.dev/r/toast.json
npx shadcn@latest add https://neobrutalism.dev/r/calendar.json
npx shadcn@latest add https://neobrutalism.dev/r/image-card.json
npx shadcn@latest add https://neobrutalism.dev/r/carousel.json
```

```error
./app/(user)/[username]/calendario/components/Calendar.tsx
33:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./app/(user)/[username]/calendario/components/EventForm.tsx
270:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./app/(user)/[username]/calendario/components/date-utils.ts
9:3  Error: 'isSameMonth' is defined but never used.  @typescript-eslint/no-unused-vars
12:3  Error: 'isBefore' is defined but never used.  @typescript-eslint/no-unused-vars
24:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
35:11  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./app/(user)/[username]/criancas/[kid]/page.tsx
7:34  Error: 'collection' is defined but never used.  @typescript-eslint/no-unused-vars
7:46  Error: 'query' is defined but never used.  @typescript-eslint/no-unused-vars
7:53  Error: 'where' is defined but never used.  @typescript-eslint/no-unused-vars
7:60  Error: 'getDocs' is defined but never used.  @typescript-eslint/no-unused-vars
20:41  Error: 'CardFooter' is defined but never used.  @typescript-eslint/no-unused-vars
27:53  Error: 'Plus' is defined but never used.  @typescript-eslint/no-unused-vars
27:59  Error: 'Trash' is defined but never used.  @typescript-eslint/no-unused-vars
240:14  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
265:14  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/criancas/components/ChildrenCarousel.tsx
25:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
82:14  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/criancas/components/ChildrenGrid.tsx
2:10  Error: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
6:32  Error: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
37:14  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
61:14  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/criancas/page.tsx
21:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
33:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
127:13  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop
133:13  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop

./app/(user)/[username]/financas/components/ExpenseAnalytics.tsx
40:12  Error: '_year' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/financas/components/ExpenseForm.tsx
96:3  Error: 'resetSplitPercentages' is defined but never used.  @typescript-eslint/no-unused-vars
281:33  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./app/(user)/[username]/financas/components/ExpenseList.tsx
5:52  Error: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
70:12  Error: '_' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/financas/components/ExpenseModal.tsx
14:19  Error: 'Child' is defined but never used.  @typescript-eslint/no-unused-vars
23:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
39:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
47:14  Error: '_' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/financas/page.tsx
210:8  Warning: React Hook useCallback has an unnecessary dependency: 'toast'. Either exclude it or remove the dependency array. Outer scope values like 'toast' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
241:8  Warning: React Hook useCallback has an unnecessary dependency: 'toast'. Either exclude it or remove the dependency array. Outer scope values like 'toast' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
359:9  Warning: React Hook useCallback has an unnecessary dependency: 'toast'. Either exclude it or remove the dependency array. Outer scope values like 'toast' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
453:19  Error: 'groupRef' is assigned a value but never used.  @typescript-eslint/no-unused-vars
625:18  Error: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
943:37  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop
959:37  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop
969:37  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop
975:37  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop

./app/(user)/[username]/home/components/ChildCard.tsx
19:10  Error: 'photoFile' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/home/components/CurrentWeek.tsx
8:47  Error: 'Plus' is defined but never used.  @typescript-eslint/no-unused-vars
11:10  Error: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
26:10  Error: 'loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
27:10  Error: 'children' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/home/page.tsx
138:34  Error: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
404:33  Error: Do not pass children as props. Instead, nest children between the opening and closing tags.  react/no-children-prop

./app/(user)/[username]/perfil/components/ChildrenSection.tsx
31:18  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/perfil/components/ErrorStates.tsx
33:1  Warning: Assign object to a variable before exporting as module default  import/no-anonymous-default-export

./app/(user)/[username]/perfil/components/InfoSections.tsx
83:1  Warning: Assign object to a variable before exporting as module default  import/no-anonymous-default-export

./app/(user)/[username]/perfil/hooks/useProfileEdit.ts
41:15  Error: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
41:25  Error: 'confirmPassword' is assigned a value but never used.  @typescript-eslint/no-unused-vars
41:42  Error: 'uid' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./app/(user)/[username]/perfil/page.tsx
135:21  Error: 'password' is assigned a value but never used.  @typescript-eslint/no-unused-vars
135:31  Error: 'confirmPassword' is assigned a value but never used.  @typescript-eslint/no-unused-vars
135:48  Error: 'uid' is assigned a value but never used.  @typescript-eslint/no-unused-vars
135:53  Error: 'username' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./components/ui/calendar.tsx
58:25  Error: 'props' is defined but never used.  @typescript-eslint/no-unused-vars
59:26  Error: 'props' is defined but never used.  @typescript-eslint/no-unused-vars

./components/ui/carousel.tsx
202:17  Error: 'variant' is assigned a value but never used.  @typescript-eslint/no-unused-vars
231:17  Error: 'variant' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./components/ui/image-card.tsx
9:7  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./components/ui/input.tsx
5:18  Error: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type

./components/ui/textarea.tsx
5:18  Error: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
```


```
when I'm logged my /home/dusoudeth/Documentos/github/compartilar/app/components/Header.tsx component does not show my profile picture
```