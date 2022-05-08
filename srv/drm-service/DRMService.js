const cds = require("@sap/cds");
const bodyparser = require("body-parser");
const { DRMHandler } = require("./handlers/DRMHandler");
/**
 * This class implement the API EndPoints that are required by
 * https://api.sap.com/api/DSAPIsImplementedByApplication/overview
 */
class DRMService extends DRMHandler {

    async init() {
        // https://cap.cloud.sap/docs/node.js/cds-facade#cds-app
        // cds.app.use(bodyparser.json());
        await super.init();
        const DrmEntity = cds.entities("com.sap.cgt.db").DrmEntity;

        /**
         * This api has to be implemented by the application to return the list of legal entities for a particular data subject role.
         * The endpoint is invoked by DRM to display the legal entities in the value help during business purpose creation.
         * **Note** -
         * * The above endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => legalEntity => legalEntityValueHelpEndPoint
         *
         * @param dataSubjectRole - List of Legal Entities is returned associated with this Data Subject Role parameter.
         * @returns {value, valueDesc}.
         */
        cds.app.get("/dpp/drm/legalEntities/:dataSubjectRole", async (req, res, next) => {
            try {
                const result = await this.getLegalEntities(
                    req.params.dataSubjectRole,
                    cds.context
                );
                res.status(200).json(result);
            } catch (err) {
                next(err);
            }
        });

        /**
         * This api should be implemented by the application to return the list of data subjects associated with a given transactional data and data subject role for which the end of purpose has been reached.
         * This endpoint is invoked by DRM when recheck is triggered - to check for data subjects of a particular application group that are eligible for deletion.
         * The residenceDate passed in the payload is calculated based on the residence rules that is configured for the transactional data for a given -
         * dataSubjectRole and legalEntity of the application group.
         * If the residenceDate passed is on or before the current date then the data subject has completed the end of purpose with respect to the given transactional data.
         * **Note**-
         *
         * * this endpoint should be provided in the service instance configuration under:
         * retention-configs => dataSubjects=> legalGrounds => dataSubjectsEndofResidence
         *
         * @param body - Request body.
         * @returns .
         */
        cds.app.post("/dpp/drm/endofResidenceDS", async (req, res, next) => {
            try {
                const result = await this.getDataSubjectsEndofResidence(req.body);
                res.status(200).json(result);
            } catch (err) {
                next(err);
            }
        });

        /**
         * This endpoint has to be implemented by the application only if there is more than one transactional data configured for the application.
         * When recheck is triggered to check for deletable data subjects of a give application, DRM will first invoke the dataSubjectsEndofResidence endpoint following which this endpoint would be called, in case more than one transactional data is configured.
         * The next transactional data of the application and the list of data subjects that have reached the end of residence - initially returned by the dataSubjectEndofResidence endpoint, along with the residence rules for the current transactional data would be passed in the payload for the first call.
         * This endpoint would be consecutively called for all the remaining transactional data of the application group passing the list of data subjects that were returned in the previous call along with it's residence rules to the payload.
         * If for the data subjects passed in the payload the residence period is complete then, return only these data subject ids in the response.
         * **Note** -
         *
         * * This endpoint has to be provided in the serivce instance configuration under-
         * retention-configs => dataSubjects => legalGrounds =>dataSubjectsEndofResidenceConfirmation
         *
         * @param body - Request body.
         * @returns .
         */
        cds.app.post("/dpp/drm/endofResidenceDSConfirmation", async (req, res, next) => {
            try {
                // Return empty array as there is no transaction data need to be checked
                this.logger.info("POST /endofResidenceDSConfirmation");
                res.status(200).json([]);
            } catch (err) {
                next(err);
            }
        });

        /**
         * This endpoint will have to be implemented by the application only if they want to display additional information like full name and email id of the data subject.
         * DRM calls this endpoint to fetch the details that will be displayed in the Delete Data Subject Information (DDS) UI.
         * This endpoint will have to return the details of all the data subjects whose ids are passed in the payload.
         * **Note**-
         *
         * * this endpoint will have to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => dataSubjectInformationEndPoint
         *
         * This option is applicable only for those applications that have set the value
         * of "dataSubjectInformationFilterEnabled" property as true in the service instance configuration.
         * @param body - Request body.
         * @param queryParameters - Object containing the following keys: search.
         * @returns .
         */
        cds.app.post("/dpp/drm/dataSubjectInformation", async (req, res, next) => {
            try {
                const rows = await super.getDataSubjectInformation(req.search, req.body);
                this.logger.info("POST /dataSubjectInformation");
                res.status(200).json(rows);
            } catch (err) {
                next(err);
            }
        });

        /**
         * The endpoint has to be implemented by the application to confirm if a given data subject has reached it's end of business or not.
         * When deletion of the data subject is triggered from DRM this is the first endpoint that would be invoked.
         * API checks if the data subject has reached it's end of business for the given transactional data and data subject role passed in the payload,
         * If the end of business is reached then the value of dataSubjectExpired field in the response will be true if not the value will be false.
         * **Note**-
         *
         * * This endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => legalGrounds => dataSubjectEndofBusinessEndPoint
         *
         * @param body - Request body.
         * @returns .
         */
        cds.app.post("/dpp/drm/dataSubjectEndOfBusiness", async (req, res, next) => {
            try {
                this.checkDataSubjectEndOfBusiness(req.body, res);
                this.logger.info("POST /dataSubjectEndOfBusiness:" + JSON.stringify(req.body));
            } catch (err) {
                next(err);
            }
        });

        /**
         * This endpoint has to be implemented by the application to return the list of legal entities associated with the data subject for a given "data subject role and transactional data"
         * When deletion of the data subject is triggered from DRM this endpoint would be called to check the list of legal entities it is associated with.
         * **Note**-
         *
         * * this endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => legalGrounds => dataSubjectLegalEntitiesEndPoint
         *
         * @param body - Request body.
         * @returns .
         */
        cds.app.post("/dpp/drm/dataSubjectLegalEntities", async (req, res, next) => {
            try {
                const result = await this.getLegalEntitiesAssociated(req, DrmEntity, cds.context);
                this.logger.info("POST /dataSubjectLegalEntities");
                res.status(200).json(result);
            } catch (err) {
                next(err);
            }
        });

        /**
         * This endpoint should be implemented by the application to return the greatest end of business date.
         * When the data subject deletion is triggered this endpoint will be called by DRM to retrieve the maximum retention start date.
         * For the transactional data associated with a given data subject role the end of business dates would be computed across all the legal entities with which the data subject is associated, based on the business rules that have been configured for it.
         * Out of all the calculated dates the maximum end of business date would be returned.
         * **Note** -
         * * This endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => legalGrounds => dataSubjectLastRetentionStartDatesEndPoint
         *
         * @param body - Request body.
         * @returns .
         */
        cds.app.post("/dpp/drm/retentionStartDate", async (req, res, next) => {
            try {
                const result =
                    await this.getDataSubjectLastRetentionStartDates(req.body);
                result ? res.status(200).json(result) : res.status(204).end();
            } catch (err) {
                next(err);
            }
        });

        // /legalGrounds
        // /conditionFieldValues
        // /deleteLegalGroundInstances
        // /destroyLegalGroundInstances
        // /AsyncdeleteLegalGroundInstances
        // /asyncCallback

        /**
         * This endpoint has to be implemented by the applications to soft delete (block) the data subject that is associated with a given dataSubject role of the application.
         * This endpoint would be invoked when the deletion of the data subject is triggered from DRM only if all the transactional data instances belonging to this data subject id and role have been blocked or destructed.
         * When the endpoint is invoked-
         * * If the maxDeletionDate passed in the payload is on or before the current date then a hard delete can be performed on the data subject.
         * * Otherwise the data subject should be blocked (soft delete) and it's maxDeletionDate should be persisted.
         *
         * **Note**-
         * * This endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => dataSubjectDeletionEndPoint
         *
         * @param body - Request body.
         * @returns .
         */
        this.on("deleteDataSubject", async (req) => {
            await this.onDeleteDataSubject(req, DrmEntity);
        });
        /**
         * This endpoint has to be implemented by the application to hard delete(destroy) all the blocked data subjects belonging to the given dataSubjectRole of the application group.
         * This endpoint is invoked by DRM once a week.
         * If the maxDeletionDate persisted for each of the data subjects associated with the given transactional data and data subject role of the application is on or before the current date
         * then a hard delete can be performed on the data subject.
         * **Note**-
         * * This endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => dataSubjectsDestroyingEndPoint
         *
         * @param body - Request body.
         * @returns .
         */
        this.on("destroyDataSubjects", async (req) => {
            await this.onDestroyDataSubjects(req, DrmEntity);
        });
        this.on("test", async (req) => {
            try {
                const id1 = "Test_01";
                const id2 = "DS_02";
                const lastName1 = "1";
                const lastName2 = "2";
                const lastName3 = "3";
                const Contact = cds.entities("com.sap.cgt.masterdata").Contact;
                let rows = await DELETE.from(Contact).where`lastName <> ''`;
                rows = await INSERT.into(Contact).entries(
                    { id: id1, lastName: lastName1 },
                    { id: id2, lastName: lastName2 }
                );
                if (!rows?.results) { return; };
                rows = await UPDATE(Contact).where`id = ${id1}`.with`lastName = ${lastName3}`;
                if (!rows) { return; };
                let result = await SELECT`id,lastName,middleName`.from(Contact).where`id = ${id1} or id = ${id2}`;
                if (!result?.length) { return; };
                rows = await DELETE.from(Contact).where`lastName >= 0`;
                if (!rows) { return; };
                rows = await INSERT.into(Contact).entries(result); //result支持select one对象, 或select from数组
                if (!rows?.affectedRows) { return; };
                result = await SELECT`*`.from(Contact).where`lastName BETWEEN 2 AND 3`; // ![%Test%] id LIKE "Test%"
                result = await SELECT`*`.from(Contact).where`id LIKE '%est%'`; // ![Test%]表示里面是一个column, id LIKE "Test%"
                result = await SELECT`*`.from(Contact).where`id LIKE '%est%' or lastName BETWEEN 2 AND 2`;
                let a = ["2", "3"];
                result = await SELECT`*`.from(Contact).where`lastName IN ${a}`;
                console.log(result);
            } catch (err) {
                console.log(err?.message);
                req.error(400, err?.message);
            };
        });
        /**
         * This callback endpoint has to be implemented by the application to block/delete the data subject that is associated with a given dataSubject role of the master data application.
         * When the deletion of the given data subject is triggered from DRM -
         * * The "/sap/drm/v2/mds/dataSubjectDeletion" endpoint would be invoked to check if all the transactional data associated with the data subject across the  application groups that make use of this master data have crossed their residence period.
         * * Once the above check is complete the "/sap/drm/v2/mds/dataSubjectDeletion" endpoint will invoke this callback endpoint-
         *    - If the data subject has reached the end of purpose across all the  application groups that use this master data then the "purposeStatus" value passed in the payoad would be 0, if the end of purpose is not reached the value would be 1.
         * * When this callback endpoint is invoked with the "purposeStatus" value as 0 in the payload
         *   - If the "deletionDate" passed in the payload is on or before the current date  then a hard delete can be performed on the data subject, else the data subject should be blocked (soft delete) and it's "deletionDate" should be persisted if it is not already saved.
         * * When this callback endpoint is invoked with the "purposeStatus" value as 1 in the payload
         *   - Then the data subject should not be blocked or deleted
         *
         * **Note**-
         * * This endpoint has to be provided in the service instance configuration under-
         * retention-configs => dataSubjects => dataSubjectDeletionEndPoint
         *
         * @param body - Request body.
         * @returns .
         */
        cds.app.post("/dpp/drm/deleteDataSubjectMaster", async (req, res, next) => {
            try {

                await this.masterDataSubjectDeletion(req, res, next, DrmEntity);

            } catch (err) {
                next(err);
            }
        });
    }
}

module.exports = DRMService;
