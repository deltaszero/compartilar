currently my `users` collection is structured just like the data below, but there is a problem with that: kids data is a subcollection of users, but my original idea was to centralize kids information into `children` collection

so please analyze the following files and plan the changes in order to fix this architecture issue

- /home/dusoudeth/Documentos/github/compartilar/.firestore-rules
- /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/criancas/novo/page.tsx
- /home/dusoudeth/Documentos/github/compartilar/app/api/children

```data
createdAt
(map)


nanoseconds
871000000
(number)


seconds
1741719611
(number)


displayName
"thiagosd"
(string)


email
"thiagosd.2.18@gmail.com"
(string)


firstName
"Thiago"
(string)



kids
(map)



UpLAh6eqALgLM9wRr27P
(map)


accessLevel
"editor"
(string)


birthDate
"2018-08-05"
(string)



createdAt
(map)


nanoseconds
980000000
(number)


seconds
1741815844
(number)


createdBy
"Mk5jY05jPfhFKfo85iunNHOMtbQ2"
(string)



editors
(array)


0
"Mk5jY05jPfhFKfo85iunNHOMtbQ2"
(string)


1
"zMrOVUIf21YxQZFAWBp3hGuHcYk1"
(string)


firstName
"Maiá"
(string)


gender
"female"
(string)


id
"UpLAh6eqALgLM9wRr27P"
(string)



interests
(array)


lastName
"Urel"
(string)


notes
"Parece a Mafalda quando acorda :D"
(string)


photoURL
"https://firebasestorage.googleapis.com/v0/b/compartilar-firebase-app.firebasestorage.app/o/children_photos%2Ftemp_1741815667748_gerpine_a_photo_of_a_12_years_old_soccer_Cuban_girl_in_a_park_i_6cdc3500-d88a-4f90-a147-1b502a8dd1ef.png?alt=media&token=532bda52-c300-4a99-951b-c5ab0a29197c"
(string)


relationship
""
(string)


schoolName
""
(string)



updatedAt
(map)


nanoseconds
980000000
(number)


seconds
1741815844
(number)



viewers
(array)


lastName
"Duarte"
(string)



subscription
(map)


activationMethod
"auto"
(string)


active
true
(boolean)


apiDirectUpdate
true
(boolean)


autoActivated
true
(boolean)


plan
"premium"
(string)


stripeCustomerId
"cus_S5l3RhkMdVcjhy"
(string)


stripeSessionId
"cs_test_a1VHkmqPvLRN2gaTGeblAGDoSmLmu944jNTGUNB3hiKLlWzhAuWBwNkGVF"
(string)


stripeSubscriptionId
"sub_1RBZXURteT9jmQohswURWovi"
(string)


updatedAt
"2025-04-08T10:38:08.657Z"
(string)


verifiedOwner
true
(boolean)


uid
"zMrOVUIf21YxQZFAWBp3hGuHcYk1"
(string)


updatedAt
March 30, 2025 at 4:53:03 PM UTC-3
(timestamp)


username
"thiagosd"
```