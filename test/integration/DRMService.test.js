'use strict';
/* eslint-disable max-len */
/* eslint-disable jest/expect-expect */
/* eslint-disable no-unused-vars */

//Global variables
const cds = require("@sap/cds");
const path = require("path");
const { expect, GET, POST, PATCH } = cds.test(path.join(__dirname, "../.."));
// const LOG = cds.log("TEST");
// const SERVICE_NAMESPACE = "com.sap.cgt.drm.service.DRMService";
const Constants = require("../../srv/common/Constants");
const { Logger, BlockStatus } = require("../../srv/common/Constants");
const { compile } = require("@sap/cds-compiler");
const Contact = "com.sap.cgt.masterdata.Contact";
const DrmEntity = "com.sap.cgt.db.DrmEntity";
const Changelog = "com.sap.cgt.changelog.changelog";
const StatusCodeList = "com.sap.cgt.configuration.StatusCodeList";

const adminBasicAuth = {
    auth: {
        username: "admin",
        password: "1234",
    },
};

describe('Data Retention Manager Service Test Suite', function () {
    jest.setTimeout(1300000);
    //Mock Data for Contact
    const drmContact = {
        createdOn: "2022-05-01T11:05:16.197Z",
        modifiedOn: "2022-05-01T11:05:16.197Z",
        id: "ElonMusk",
        gender_code: "GD002",
        department_code: "DP004",
        country_code: "CN",
        timeZone_code: "CST",
        communicationMethod_code: "CM001",
        status_code: "0",
    };

    // Defines Response Interface to be used in Test Case.
    let response = {
        status: Number,
        data: String,
    };

    let setData = async () => {
        try {
            await DELETE.from(Contact).where({ id: { like: "Test_%" } });
            await DELETE.from(DrmEntity).where({ dataSubjectID: { like: "Test_%" } });
            await DELETE.from(Changelog).where({ entityName: "Contact" });
            await DELETE.from(StatusCodeList).where({ code: { ">=": 0 } });
            await INSERT.into(StatusCodeList).entries(
                { name: "Active", descr: "Active", code: "0", criticality: "3" },
                { name: "Inactive", descr: "Inactive", code: "1", criticality: "1" },
                { name: "Blocked", descr: "Blocked", code: BlockStatus, criticality: "99" })
        } catch (err) {
            console.log(err.message);
        };
    };
    //drmService = await cds.connect.to(`${SERVICE_NAMESPACE}`);
    // const { Contact } = cds.entities("/drm/"); //com.sap.cgt.masterdata");  

    beforeAll(async () => {
        // initiate contact for DRM test suite
        // const { Contact } = cds.entities("com.sap.cgt.masterdata"); 
        // response = await cds.create(Contact, drmContact);
    });

    afterAll(async () => {
        //Delete Mock Data of Contacts
        // await cds.delete(Contact).where({ id: "ElonMusk" });

        //Delete Changelog for Contacts
        // const { Changelog } = cds.entities("com.sap.cgt.changelog");
        // await cds.delete(Changelog).where({ id: "ElonMusk" });        
    });

    it('Test API legalEntities/:dataSubjectRole', async function () {

    });

    it('Test API endofResidenceDS', async function () {

    });

    it('Test API endofResidenceDSConfirmation', async function () {

    });

    it('Test API dataSubjectInformation', async function () {

    });

    it('Test API dataSubjectEndOfBusiness EOB reached', async function () {
        let inputObj = {
            "legalGround": Constants.LegalGrounds.CONTACT_IN_MASTERDATA_MANAGEMENT,
            "dataSubjectRole": Constants.DataSubjectRoles.CONTACT,
            "dataSubjectID": drmContact.id
        };
        const eobURL = "/dpp/drm/dataSubjectEndOfBusiness";

        try {
            response = await POST(`${eobURL}`, inputObj, adminBasicAuth);
            expect(response.status).eq(200);
            expect(response.data["dataSubjectExpired"]).toBe(true);
            console.log("Contact" + `${drmContact.id}` + "reached the End of Business");
        } catch (err) {
            console.log(err);
        }
    });

    it('Test API dataSubjectEndOfBusiness unsupported Legal Ground', async function () {
        let inputObj = {
            "legalGround": Constants.LegalGrounds.CONTACT_IN_CGT_TREATEMENT_MANAGEMENT,
            "dataSubjectRole": Constants.DataSubjectRoles.CONTACT,
            "dataSubjectID": drmContact.id
        };
        const eobURL = "/dpp/drm/dataSubjectEndOfBusiness";

        try {
            response = await POST(`${eobURL}`, inputObj, adminBasicAuth);
            expect(response.status).eq(403);
            expect(response.data["dataSubjectExpired"]).toBe(false);
            console.log(response.data["dataSubjectNotExpiredReason"]);
        } catch (err) {
            console.log(err);
        }
    });

    it('Test API dataSubjectLegalEntities', async function () {

    });

    it('Test API retentionStartDate', async function () {

    });

    it("Test deleteDataSubject block contact", async () => {
        try {
            if (typeof setData === "function") {
                await setData();
            };
            const deleteDataSubject = "/drm/deleteDataSubject";
            const inputObj = {
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
                dataSubjectID: "Test_DS_01",
                maxDeletionDate: "2099-12-31T23:59:59"
            };
            /*insert user*/
            await INSERT.into(Contact).columns(["id", "status_code"]).
                values([inputObj.dataSubjectID, "0"]);
            /*block user*/
            const req = await POST(`${deleteDataSubject}`, inputObj, adminBasicAuth);
            expect(req.status).eq(Constants.STATUS_CODE.SuccessOK);
            expect(req.data).eq(Logger.BLOCK_SUCCESS);
        } catch (err) {
            console.log(err);
        }
    });

    it("Test deleteDataSubject delete contact", async () => {
        try {
            if (typeof setData === "function") {
                await setData();
            };
            const deleteDataSubject = "/drm/deleteDataSubject";
            const inputObj = {
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
                dataSubjectID: "Test_DS_02",
                maxDeletionDate: "2022-05-03T23:59:59"
            };
            /*insert user*/
            await INSERT.into(Contact).columns(["id", "status_code"]).
                values([inputObj.dataSubjectID, BlockStatus]);
            /*delete user*/
            const req = await POST(`${deleteDataSubject}`, inputObj, adminBasicAuth);
            expect(req.status).eq(Constants.STATUS_CODE.SuccessOK);
            expect(req.data).eq(Logger.DELETE_SUCCESS);
        } catch (err) {
            console.log(err);
        }
    });

    it("Test deleteDataSubject nothing match for block/delete", async () => {
        try {
            if (typeof setData === "function") {
                await setData();
            };
            const deleteDataSubject = "/drm/deleteDataSubject";
            const inputObj = {
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
                dataSubjectID: "Test_DS_01", //not exist
                maxDeletionDate: "2022-05-03T23:59:59"
            };
            const req = await POST(`${deleteDataSubject}`, inputObj, adminBasicAuth);
            expect(req.status).eq(Constants.STATUS_CODE.SuccessOK);
            expect(req.data).eq(Logger.BLOCK_NOTHING);
        } catch (err) {
            console.log(err);
        }
    });

    it("Test destroyDataSubjects destroy", async () => {
        try {
            if (typeof setData === "function") {
                await setData();
            };
            const destroyDataSubjects = "/drm/destroyDataSubjects";
            const drmEntities = [{
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
                dataSubjectID: "Test_DS_01",
                maxDeletionDate: "2022-05-02T23:59:59"
            },
            {
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
                dataSubjectID: "Test_DS_02",
                maxDeletionDate: "2022-05-02T23:59:59"
            }
            ];
            const inputObj = {
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
            };

            /*insert contact & drm entity*/
            await INSERT.into(Contact).columns(["id", "status_code"]).
                values(["Test_DS_01", BlockStatus]);
            await INSERT.into(Contact).columns(["id", "status_code"]).
                values(["Test_DS_02", BlockStatus]);
            await INSERT.into(DrmEntity).entries(drmEntities);
            /*delete user*/
            const req = await POST(`${destroyDataSubjects}`, inputObj, adminBasicAuth);
            expect(req.status).eq(Constants.STATUS_CODE.SuccessOK202);
            expect(req.data).eq(Logger.DESTROY_SUCCESS);
            if (typeof setData === "function") {
                await setData();
            };
        } catch (err) {
            console.log(err);
        }
    });

    it("Test destroyDataSubjects nothing match for destroy", async () => {
        try {
            if (typeof setData === "function") {
                await setData();
            };
            const destroyDataSubjects = "/drm/destroyDataSubjects";
            const inputObj = {
                applicationGroupName: "sapCGT",
                dataSubjectRole: "contact",
            };
            /*delete user*/
            const req = await POST(`${destroyDataSubjects}`, inputObj, adminBasicAuth);
            expect(req.status).eq(Constants.STATUS_CODE.SuccessOK202);
            expect(req.data).eq(Logger.DESTROY_NOTHING);
        } catch (err) {
            console.log(err);
        }
    });

});
