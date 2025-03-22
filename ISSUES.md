dusoudeth@u22:~/Documentos/github/compartilar$ npx tsc --noEmit
.next/types/app/api/parental-plan/[id]/education/route.ts:49:7 - error TS2344: Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: RouteParams; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

 49       {
          ~
 50         __tag__: 'GET'
    ~~~~~~~~~~~~~~~~~~~~~~
... 
 52         __param_type__: SecondArg<MaybeField<TEntry, 'GET'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 53       },
    ~~~~~~~

.next/types/app/api/parental-plan/[id]/education/route.ts:166:7 - error TS2344: Type '{ __tag__: "POST"; __param_position__: "second"; __param_type__: RouteParams; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

166       {
          ~
167         __tag__: 'POST'
    ~~~~~~~~~~~~~~~~~~~~~~~
... 
169         __param_type__: SecondArg<MaybeField<TEntry, 'POST'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
170       },
    ~~~~~~~

.next/types/app/api/parental-plan/[id]/education/route.ts:205:7 - error TS2344: Type '{ __tag__: "PUT"; __param_position__: "second"; __param_type__: RouteParams; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

205       {
          ~
206         __tag__: 'PUT'
    ~~~~~~~~~~~~~~~~~~~~~~
... 
208         __param_type__: SecondArg<MaybeField<TEntry, 'PUT'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
209       },
    ~~~~~~~

.next/types/app/api/parental-plan/[id]/education/route.ts:244:7 - error TS2344: Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: RouteParams; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

244       {
          ~
245         __tag__: 'DELETE'
    ~~~~~~~~~~~~~~~~~~~~~~~~~
... 
247         __param_type__: SecondArg<MaybeField<TEntry, 'DELETE'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
248       },
    ~~~~~~~

.next/types/app/api/parental-plan/[id]/education/route.ts:283:7 - error TS2344: Type '{ __tag__: "PATCH"; __param_position__: "second"; __param_type__: RouteParams; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

283       {
          ~
284         __tag__: 'PATCH'
    ~~~~~~~~~~~~~~~~~~~~~~~~
... 
286         __param_type__: SecondArg<MaybeField<TEntry, 'PATCH'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
287       },
    ~~~~~~~

app/(user)/[username]/plano/components/RegularEducationForm.tsx:273:65 - error TS2345: Argument of type 'string | FieldStatus | undefined' is not assignable to parameter of type 'string | FieldStatus'.
  Type 'undefined' is not assignable to type 'string | FieldStatus'.

273                       onClick={() => handleFieldEdit(fieldName, fieldData)}
                                                                    ~~~~~~~~~

app/(user)/[username]/plano/components/RegularEducationForm.tsx:441:65 - error TS2345: Argument of type 'string | FieldStatus | undefined' is not assignable to parameter of type 'string | FieldStatus'.
  Type 'undefined' is not assignable to type 'string | FieldStatus'.

441                       onClick={() => handleFieldEdit(fieldName, fieldData)}
                                                                    ~~~~~~~~~

app/(user)/[username]/plano/services/plan-service.ts:312:46 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(query: Query<DocumentData, DocumentData>, compositeFilter: QueryCompositeFilterConstraint, ...queryConstraints: QueryNonFilterConstraint[]): Query<...>', gave the following error.
    Argument of type 'number' is not assignable to parameter of type 'QueryCompositeFilterConstraint'.
  Overload 2 of 2, '(query: Query<DocumentData, DocumentData>, ...queryConstraints: QueryConstraint[]): Query<DocumentData, DocumentData>', gave the following error.
    Argument of type 'number' is not assignable to parameter of type 'QueryConstraint'.

312       changeLogQuery = query(changeLogQuery, limit);
                                                 ~~~~~


app/api/auth/get-token/route.ts:15:39 - error TS2339: Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'.

15     const sessionCookie = cookieStore.get('session')?.value;
                                         ~~~

  app/api/auth/get-token/route.ts:15:39
    15     const sessionCookie = cookieStore.get('session')?.value;
                                             ~~~
    Did you forget to use 'await'?


Found 9 errors in 4 files.

Errors  Files
     5  .next/types/app/api/parental-plan/[id]/education/route.ts:49
     2  app/(user)/[username]/plano/components/RegularEducationForm.tsx:273
     1  app/(user)/[username]/plano/services/plan-service.ts:312
     1  app/api/auth/get-token/route.ts:15