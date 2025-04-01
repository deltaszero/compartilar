dusoudeth@u22:~/Documentos/github/compartilar$ npx tsc --noEmit
.next/types/app/(user)/[username]/plano/[id]/educacao/page.ts:2:24 - error TS2306: File '/home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano/[id]/educacao/page.tsx' is not a module.

2 import * as entry from '../../../../../../../../app/(user)/[username]/plano/[id]/educacao/page.js'
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.next/types/app/(user)/[username]/plano/[id]/educacao/page.ts:5:29 - error TS2306: File '/home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plano/[id]/educacao/page.tsx' is not a module.

5 type TEntry = typeof import('../../../../../../../../app/(user)/[username]/plano/[id]/educacao/page.js')
                              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:323:62 - error TS18047: 'nestedField' is possibly 'null'.

323           if (typeof nestedField === 'object' && !('type' in nestedField)) {
                                                                 ~~~~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:324:28 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(o: ArrayLike<unknown> | { [s: string]: unknown; }): [string, unknown][]', gave the following error.
    Argument of type 'object | null' is not assignable to parameter of type 'ArrayLike<unknown> | { [s: string]: unknown; }'.
      Type 'null' is not assignable to type 'ArrayLike<unknown> | { [s: string]: unknown; }'.
  Overload 2 of 2, '(o: {}): [string, any][]', gave the following error.
    Argument of type 'object | null' is not assignable to parameter of type '{}'.
      Type 'null' is not assignable to type '{}'.

324             Object.entries(nestedField).forEach(([deepId, deepField]) => {
                               ~~~~~~~~~~~


app/(user)/[username]/plano/[id]/guarda/page.tsx:327:62 - error TS18047: 'deepField' is possibly 'null'.

327               if (typeof deepField === 'object' && 'type' in deepField && deepField.required) {
                                                                 ~~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:327:85 - error TS2339: Property 'required' does not exist on type 'object & Record<"type", unknown>'.

327               if (typeof deepField === 'object' && 'type' in deepField && deepField.required) {
                                                                                        ~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:333:94 - error TS2339: Property 'required' does not exist on type 'object & Record<"type", unknown>'.

333           } else if (typeof nestedField === 'object' && 'type' in nestedField && nestedField.required) {
                                                                                                 ~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:440:13 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{}'.
  No index signature with a parameter of type 'string' was found on type '{}'.

440             originalValues[key] = value.value;
                ~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:442:13 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{}'.
  No index signature with a parameter of type 'string' was found on type '{}'.

442             originalValues[key] = value;
                ~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:454:33 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{}'.
  No index signature with a parameter of type 'string' was found on type '{}'.

454           const originalValue = originalValues[dbFieldName];
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/[id]/guarda/page.tsx:603:61 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(...items: ConcatArray<{ value: string; label: string; }>[]): { value: string; label: string; }[]', gave the following error.
    Object literal may only specify known properties, and 'tooltip' does not exist in type '{ value: string; label: string; }'.
  Overload 2 of 2, '(...items: ({ value: string; label: string; } | ConcatArray<{ value: string; label: string; }>)[]): { value: string; label: string; }[]', gave the following error.
    Object literal may only specify known properties, and 'tooltip' does not exist in type '{ value: string; label: string; }'.

603                   { value: 'alternado', label: 'Alternado', tooltip: 'Alternado significa que a criança possui dois lares de referência, alternando entre eles' }
                                                                ~~~~~~~


app/(user)/[username]/plano/components/forms/FormLayout.tsx:44:16 - error TS2322: Type '"warning"' is not assignable to type '"default" | "destructive" | null | undefined'.

44         <Alert variant="warning">
                  ~~~~~~~

  components/ui/alert.tsx:11:7
    11       variant: {
             ~~~~~~~~~~
    12         default: "bg-main text-mtext",
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    13         destructive: "bg-black text-white",
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    14       },
       ~~~~~~~
    The expected type comes from property 'variant' which is declared here on type 'IntrinsicAttributes & HTMLAttributes<HTMLDivElement> & VariantProps<(props?: (ConfigVariants<{ variant: { default: string; destructive: string; }; }> & ClassProp) | undefined) => string> & RefAttributes<...>'

app/(user)/[username]/plano/components/forms/FormSection.tsx:43:74 - error TS18047: 'nestedField' is possibly 'null'.

43                       if (typeof nestedField === 'object' && !('type' in nestedField)) {
                                                                            ~~~~~~~~~~~

app/(user)/[username]/plano/components/forms/FormSection.tsx:47:45 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(o: ArrayLike<unknown> | { [s: string]: unknown; }): [string, unknown][]', gave the following error.
    Argument of type 'object | null' is not assignable to parameter of type 'ArrayLike<unknown> | { [s: string]: unknown; }'.
      Type 'null' is not assignable to type 'ArrayLike<unknown> | { [s: string]: unknown; }'.
  Overload 2 of 2, '(o: {}): [string, any][]', gave the following error.
    Argument of type 'object | null' is not assignable to parameter of type '{}'.
      Type 'null' is not assignable to type '{}'.

47                             {Object.entries(nestedField).map(([deepId, deepField]) => {
                                               ~~~~~~~~~~~


app/(user)/[username]/plano/components/forms/FormSection.tsx:50:78 - error TS18047: 'deepField' is possibly 'null'.

50                               if (typeof deepField === 'object' && 'type' in deepField) {
                                                                                ~~~~~~~~~

app/(user)/[username]/plano/components/forms/FormSection.tsx:54:37 - error TS2322: Type 'object & Record<"type", unknown>' is not assignable to type 'FieldQuestion'.
  Type 'Record<"type", unknown>' is missing the following properties from type 'SelectQuestion<string>': options, id, label, required

54                                     field={deepField}
                                       ~~~~~

  app/(user)/[username]/plano/components/forms/FormField.tsx:12:3
    12   field: FieldQuestion;
         ~~~~~
    The expected type comes from property 'field' which is declared here on type 'IntrinsicAttributes & FormFieldProps'

app/(user)/[username]/plano/components/forms/FormSection.tsx:74:29 - error TS2322: Type 'object & Record<"type", unknown>' is not assignable to type 'FieldQuestion'.
  Type 'Record<"type", unknown>' is missing the following properties from type 'SelectQuestion<string>': options, id, label, required

74                             field={nestedField}
                               ~~~~~

  app/(user)/[username]/plano/components/forms/FormField.tsx:12:3
    12   field: FieldQuestion;
         ~~~~~
    The expected type comes from property 'field' which is declared here on type 'IntrinsicAttributes & FormFieldProps'

app/(user)/[username]/plano/services/plan-service.ts:323:25 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ general?: GeneralSection | undefined; education?: EducationSection | undefined; extracurricular?: ExtracurricularSection | undefined; ... 7 more ...; consequences?: ConsequencesSection | undefined; }'.
  No index signature with a parameter of type 'string' was found on type '{ general?: GeneralSection | undefined; education?: EducationSection | undefined; extracurricular?: ExtracurricularSection | undefined; ... 7 more ...; consequences?: ConsequencesSection | undefined; }'.

323     const sectionData = plan.sections?.[section] || {};
                            ~~~~~~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/services/plan-service.ts:420:25 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ general?: GeneralSection | undefined; education?: EducationSection | undefined; extracurricular?: ExtracurricularSection | undefined; ... 7 more ...; consequences?: ConsequencesSection | undefined; }'.
  No index signature with a parameter of type 'string' was found on type '{ general?: GeneralSection | undefined; education?: EducationSection | undefined; extracurricular?: ExtracurricularSection | undefined; ... 7 more ...; consequences?: ConsequencesSection | undefined; }'.

420     const sectionData = planData.sections?.[section] || {};
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/services/plan-service.ts:545:25 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ general?: GeneralSection | undefined; education?: EducationSection | undefined; extracurricular?: ExtracurricularSection | undefined; ... 7 more ...; consequences?: ConsequencesSection | undefined; }'.
  No index signature with a parameter of type 'string' was found on type '{ general?: GeneralSection | undefined; education?: EducationSection | undefined; extracurricular?: ExtracurricularSection | undefined; ... 7 more ...; consequences?: ConsequencesSection | undefined; }'.

545     const sectionData = planData.sections?.[section] || {};
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/(user)/[username]/plano/services/plan-service.ts:587:20 - error TS2304: Cannot find name 'originalValue'.

587       fieldsAfter: originalValue !== undefined ? { [fieldName]: originalValue } : undefined,
                       ~~~~~~~~~~~~~

app/(user)/[username]/plano/services/plan-service.ts:587:65 - error TS2304: Cannot find name 'originalValue'.

587       fieldsAfter: originalValue !== undefined ? { [fieldName]: originalValue } : undefined,
                                                                    ~~~~~~~~~~~~~

app/(user)/[username]/plano/services/plan-service.ts:595:66 - error TS2554: Expected 3 arguments, but got 4.

595       await updateNotificationStatus(planId, section, fieldName, 'canceled');
                                                                     ~~~~~~~~~~


Found 23 errors in 5 files.

Errors  Files
     2  .next/types/app/(user)/[username]/plano/[id]/educacao/page.ts:2
     9  app/(user)/[username]/plano/[id]/guarda/page.tsx:323
     1  app/(user)/[username]/plano/components/forms/FormLayout.tsx:44
     5  app/(user)/[username]/plano/components/forms/FormSection.tsx:43
     6  app/(user)/[username]/plano/services/plan-service.ts:323