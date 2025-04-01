Please, i need you re-structure the Parental Plan form.

The form template is in /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano/README.md, formatted in markdown. Analyze it and create a general structure of files only for "1. Geral" in /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano/[id]/guarda, but keep in mind the entire form.

I'd like some approach that contain the following requirements:
1. the use of data.ts to keep questions modular
2. questions should have optional fields that if user want to, could be used as tooltips, to clarify questions and alternatives
3. the form state should be at server side of application, preferably at `parental_plans` (use /home/dusoudeth/Documentos/github/compartilar/.firestore-rules as reference)
4. the form has the following handshake dynamics:
   1. at the begin the user choose the kid and editors of the plan
   2. every time the fields in form is changed a notification is sent to the editors of the plan, then the editors need to approve the change
   3. between the change and acceptance/rejection no one is no longer able to change that form
   4. the user that changed and sent for approval is able to cancel the change
   5. a log of changes is maintained in `parental_plans`