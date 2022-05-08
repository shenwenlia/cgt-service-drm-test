"use strict";
const ApplicationGroup = Object.freeze({
    CGT_TMP: "CGT_TMP"
});

const DataSubjectRoles = Object.freeze({
    CONTACT: "Contact",
});

const LegalGrounds = Object.freeze({
    CONTACT_IN_MASTERDATA_MANAGEMENT: "ContactInMasterdataManagement",
    CONTACT_IN_CGT_TREATEMENT_MANAGEMENT: "ContactInCGTTreatementManagement"
});

const StartTimes = Object.freeze({
    CHANGEDAT: "ChangedAt"
});

const CHANGELOG_PATH = "com.sap.cgt.changelog";
const MASTERDATA_PATH = "com.sap.cgt.masterdata";
const STATUS_CODE  = {
    SuccessOK: 200,
    SuccessCreate: 201,
    SuccessOK202: 202,
    ClientErrorBadRequest: 400
};
const Logger = {
    BLOCK_SUCCESS: "blocked successfully",
    DELETE_SUCCESS: "deleted successfully",
    BLOCK_NOTHING: "nothing match for block/delete",
    DESTROY_SUCCESS: "Accepted. Asynchronous process to destroy blocked data subjects is triggered successfully",
    DESTROY_NOTHING: "nothing match for destroy"
};

const BlockStatus = "2";

module.exports = {
    ApplicationGroup,
    DataSubjectRoles,
    LegalGrounds,
    StartTimes,
    CHANGELOG_PATH,
    MASTERDATA_PATH,
    STATUS_CODE,
    Logger,
    BlockStatus    
};
