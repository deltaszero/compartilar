dusoudeth@u22:~/Documentos/github/compartilar$ npx tsc --noEmit
app/api/children/[id]/calendar/events/route.ts:112:13 - error TS2741: Property 'title' is missing in type '{ childId: string; startDate: any; endDate: any; createdAt: any; updatedAt: any; id: string; }' but required in type 'CalendarEvent'.

112       const event: CalendarEvent = {
                ~~~~~

  app/api/children/[id]/calendar/events/route.ts:9:3
    9   title: string;
        ~~~~~
    'title' is declared here.

app/api/children/[id]/calendar/route.ts:99:7 - error TS2740: Type 'Query<DocumentData, DocumentData>' is missing the following properties from type 'CollectionReference<DocumentData, DocumentData>': id, parent, path, listDocuments, and 2 more.

99       query = query.where('startDate', '>=', Timestamp.fromDate(startDateTime));
         ~~~~~

app/api/children/[id]/calendar/route.ts:103:5 - error TS2740: Type 'Query<DocumentData, DocumentData>' is missing the following properties from type 'CollectionReference<DocumentData, DocumentData>': id, parent, path, listDocuments, and 2 more.

103     query = query.orderBy('startDate', 'asc');
        ~~~~~

app/api/children/[id]/calendar/route.ts:118:13 - error TS2741: Property 'title' is missing in type '{ childId: string; startDate: any; endDate: any; createdAt: any; updatedAt: any; id: string; }' but required in type 'CalendarEvent'.

118       const event: CalendarEvent = {
                ~~~~~

  app/api/children/[id]/calendar/route.ts:9:3
    9   title: string;
        ~~~~~
    'title' is declared here.

app/api/children/[id]/calendar/route.ts:303:12 - error TS2304: Cannot find name 'newEvent'.

303         ...newEvent,
               ~~~~~~~~


Found 5 errors in 2 files.

Errors  Files
     1  app/api/children/[id]/calendar/events/route.ts:112
     4  app/api/children/[id]/calendar/route.ts:99