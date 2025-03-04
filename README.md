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

```


```
now, read the files

+ /home/dusoudeth/Documentos/github/compartilar/firebase.json
+ /home/dusoudeth/Documentos/github/compartilar/app/lib/firebaseConfig.ts
+ /home/dusoudeth/Documentos/github/compartilar/context/userContext.tsx
+ /home/dusoudeth/Documentos/github/compartilar/.firestore-rules
+ /home/dusoudeth/Documentos/github/compartilar/.storage-rules

and verify the folder of the old calendar implementation

+ /home/dusoudeth/Documentos/github/compartilar_backup/app/(user)/[username]/calendario/components

and please, connect my /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/page.tsx to my `calendar_events` for creation, visualization and deletion of events
```

```
read the files

+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/calendar-service.ts
+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/Calendar.tsx
+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/CalendarGrid.tsx
+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/CalendarHeader.tsx
+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/DayEvents.tsx
+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/EventForm.tsx
+ /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendario/components/types.ts

and if possible change dependence from daysjs to react-day-picker

if not possible, please help me to solve

(moderadamente) dusoudeth@u22:~/Documentos/github/compartilar$ npm install dayjs
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: react-day-picker@8.10.1
npm error Found: react@19.0.0
npm error node_modules/react
npm error   peer react@">=16.8.0" from @floating-ui/react-dom@2.1.2
npm error   node_modules/@floating-ui/react-dom
npm error     @floating-ui/react-dom@"^2.0.0" from @radix-ui/react-popper@1.2.2
npm error     node_modules/@radix-ui/react-popper
npm error       @radix-ui/react-popper@"1.2.2" from @radix-ui/react-menu@2.1.6
npm error       node_modules/@radix-ui/react-menu
npm error         @radix-ui/react-menu@"2.1.6" from @radix-ui/react-dropdown-menu@2.1.6
npm error         node_modules/@radix-ui/react-dropdown-menu
npm error         1 more (@radix-ui/react-menubar)
npm error       2 more (@radix-ui/react-popover, @radix-ui/react-select)
npm error   peer react@"^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc" from @radix-ui/react-arrow@1.1.2
npm error   node_modules/@radix-ui/react-arrow
npm error     @radix-ui/react-arrow@"1.1.2" from @radix-ui/react-popper@1.2.2
npm error     node_modules/@radix-ui/react-popper
npm error       @radix-ui/react-popper@"1.2.2" from @radix-ui/react-menu@2.1.6
npm error       node_modules/@radix-ui/react-menu
npm error         @radix-ui/react-menu@"2.1.6" from @radix-ui/react-dropdown-menu@2.1.6
npm error         node_modules/@radix-ui/react-dropdown-menu
npm error         1 more (@radix-ui/react-menubar)
npm error       2 more (@radix-ui/react-popover, @radix-ui/react-select)
npm error   48 more (@radix-ui/react-avatar, @radix-ui/react-checkbox, ...)
npm error
npm error Could not resolve dependency:
npm error peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from react-day-picker@8.10.1
npm error node_modules/react-day-picker
npm error   react-day-picker@"^8.10.1" from the root project
npm error
npm error Conflicting peer dependency: react@18.3.1
npm error node_modules/react
npm error   peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from react-day-picker@8.10.1
npm error   node_modules/react-day-picker
npm error     react-day-picker@"^8.10.1" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
npm error to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /home/dusoudeth/.npm/_logs/2025-03-04T11_13_37_759Z-eresolve-report.txt
npm error A complete log of this run can be found in: /home/dusoudeth/.npm/_logs/2025-03-04T11_13_37_759Z-debug-0.log
```

```
please, in UserNavbar component at /home/dusoudeth/Documentos/github/compartilar/app/components/logged-area/ui/UserProfileBar.tsx i'd like to replace the `pathname` by a search bar in which users can search for friends and invite them to be friends, using similar apporach of the old version components

+ /home/dusoudeth/Documentos/github/compartilar_backup/app/components/logged-area/friendship/FriendSearch.tsx
+ /home/dusoudeth/Documentos/github/compartilar_backup/app/components/logged-area/friendship/FriendRequests.tsx
```