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
```


```
please, read the following files

+ /home/dusoudeth/Documentos/github/compartilar_backup/app/(auth)/signup/layout.tsx
+ /home/dusoudeth/Documentos/github/compartilar_backup/app/(auth)/login/page.tsx
+ /home/dusoudeth/Documentos/github/compartilar_backup/app/(auth)/login/redirect/page.tsx 
+ /home/dusoudeth/Documentos/github/compartilar_backup/app/(auth)/signup/page.tsx

I'd like to refactor them into a new login page at /home/dusoudeth/Documentos/github/compartilar/app/(auth)/login/page.tsx as following: 
i'd like to maintain the two-side layout of login page, with typing effect at left, but at left i'd like to unify login and signup in a shadcn "tabs" component composed by login fields and a simplified signup tab in which the user defines only email, username and password

for authentication i'll use Firebase Auth, which is governed by
- /home/dusoudeth/Documentos/github/compartilar/context/userContext.tsx
- /home/dusoudeth/Documentos/github/compartilar/lib/firebaseConfig.ts do not create any folder

All these files already exists, you do not need to create them
```