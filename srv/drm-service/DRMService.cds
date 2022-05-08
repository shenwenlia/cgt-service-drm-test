namespace com.sap.cgt.drm.service;
using com.sap.cgt.db as db from '../../db/index';

service DRMService @(path : '/drm') @(requires : 'authenticated-user') {
    entity DrmEntity as projection on db.DrmEntity;

    action deleteDataSubject(applicationGroupName : String(30), dataSubjectRole : String(30), dataSubjectID : String(40), maxDeletionDate : String(40));
    action destroyDataSubjects(applicationGroupName : String(30), dataSubjectRole : String(30));
    
    action test(applicationGroupName : String(30), dataSubjectRole : String(30));
    
}
