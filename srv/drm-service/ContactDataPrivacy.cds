// https://cap.cloud.sap/docs/guides/data-privacy#audit-log
using com.sap.cgt.masterdata as md from '@sap/cgt-udm/model/masterdata';
annotate md.Contact with @PersonalData               : {
    DataSubjectRole : 'Contact',
    EntitySemantics : 'DataSubject'
} {
    id                  @PersonalData.FieldSemantics : 'DataSubjectID';
    lastName            @PersonalData.IsPotentiallyPersonal;
    middleName          @PersonalData.IsPotentiallyPersonal;
    firstName           @PersonalData.IsPotentiallyPersonal;
    formOfAddress       @PersonalData.IsPotentiallyPersonal;
    birthDate           @PersonalData.IsPotentiallyPersonal;
    formattedPersonName @PersonalData.IsPotentiallyPersonal;
    department          @PersonalData.IsPotentiallyPersonal;
    street              @PersonalData.IsPotentiallyPersonal;
    floor               @PersonalData.IsPotentiallyPersonal;
    door                @PersonalData.IsPotentiallyPersonal;
    houseNumber         @PersonalData.IsPotentiallyPersonal;
    building            @PersonalData.IsPotentiallyPersonal;
    district            @PersonalData.IsPotentiallyPersonal;
    town                @PersonalData.IsPotentiallyPersonal;
    state               @PersonalData.IsPotentiallyPersonal;
    postalCode          @PersonalData.IsPotentiallyPersonal;
    country             @PersonalData.IsPotentiallyPersonal;
    careOf              @PersonalData.IsPotentiallyPersonal;
    telephone           @PersonalData.IsPotentiallyPersonal;
    mobilePhone         @PersonalData.IsPotentiallyPersonal;
    email               @PersonalData.IsPotentiallyPersonal
}

annotate md.Contact with @AuditLog.Operation : {
    Read   : true,
    Insert : true,
    Update : true,
    Delete : true
};
