namespace com.sap.cgt.db;

using {cuid} from '@sap/cds/common';
entity DrmEntity: cuid {
    applicationGroupName : String(30);
    dataSubjectRole      : String(30);
    dataSubjectID        : String(40); //ContactPerson
    maxDeletionDate      : Timestamp;
};

