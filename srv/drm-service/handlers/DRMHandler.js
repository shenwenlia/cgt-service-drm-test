const { BaseService } = require("../../common/BaseService");
const { ChangelogDBHelper } = require("../../common/ChangelogDBHelper");
const cds = require("@sap/cds");
const path = require("path");
const { SELECT, UPDATE } = cds.ql;
const {
    // AuditLogHelper,
    AuditMessageManager,
    ResourceManager,
    CommonError
} = require("@sap/cgt-util");
const {
    ApplicationGroup,
    DataSubjectRoles,
    LegalGrounds,
    MASTERDATA_PATH,
    Logger,
    BlockStatus
} = require("../../common/Constants");

class DRMHandler extends BaseService {// 
    async init() {
        await super.init();
        // this.auditLogService = await cds.connect.to("audit-log");
        // this.auditLogHelper = new AuditLogHelper(this.auditLogService);
        this.AuditMessageManager = AuditMessageManager;
        this.ResourceManager = new ResourceManager(path.resolve(__dirname, "../../i18n/i18n.properties"));
        this.changelog = new ChangelogDBHelper();
        // The Data Subject whose lifecycle is controlled by DRM
        this.DataSubject = cds.entities(MASTERDATA_PATH).Contact;
    };

    /**
     * Use tenant ID as legal entity or "LE"
     * @param {string} dataSubjectRole 
     * @param {context} context 
     * @returns 
     */
    async getLegalEntities(dataSubjectRole, context) {
        if (dataSubjectRole && context) {
            const legalEntity = {
                value: context.tenant || "LE",
                valueDesc: "Legal Entity",
            };
            const entityArray = [];
            entityArray.push(legalEntity);
            return entityArray;
        }
    }

    /**
     * Get data subject detail information
     * @param {string} search
     * @param {object} dataSubjectInfo
     * @returns
     */
    async getDataSubjectInformation(search, dataSubjectInfo) {
        // Get Contact info
        if (dataSubjectInfo.applicationGroupName === ApplicationGroup.CGT_TMP &&
            dataSubjectInfo.dataSubjectRole === DataSubjectRoles.CONTACT) {
            const rows = await SELECT(["id", "firstName", "email"]).from(this.DataSubject).
                where([{ ref: ["id"] }, "in", { val: dataSubjectInfo.dataSubjectIds }]);
            // Map contact info
            const result = rows.map(row => ({
                dataSubjectId: row.id,
                name: row.firstName,
                emailId: row.email
            }));
            // await this.auditLogHelper.emitDataAccessLog(
            //     AuditMessageManager.makeSecurityMessage("Read", JSON.stringify(result))
            // );
            return result;
        }
    }

    /**
     * Get associated legal entities of data subject
     * @param {*} req 
     * @param {*} drmEntity 
     * @param {*} context 
     * @returns 
     */
    async getLegalEntitiesAssociated(req, drmEntity, context) {
        if (req.body) {
            const result = [];
            let { dataSubjectRole, dataSubjectID } = req.body;
            try {
                const tx = cds.transaction(req);
                // check ID existence
                const contactID = await tx.run(SELECT.from(drmEntity)
                    .where`dataSubjectID = ${dataSubjectID} and dataSubjectRole = ${dataSubjectRole}`);
                if (contactID.length) {
                    // ID exists, return
                    if (dataSubjectRole && context) {
                        const legalEntity = context.tenant || "LE";
                        result[0] = { legalEntity: legalEntity };
                    }
                }
                return result;
            }
            catch (error) {
                console.log(error);
            }
        }
    }

    /**
     * Delete/Destroy data subject
     * @param {*} req 
     * @param {*} drmEntity 
     */
    async masterDataSubjectDeletion(req, res, next, drmEntity) {
        const data = req.body;
        const deletionDate = new Date(data.deletionDate);
        const retentionStartDate = new Date(data.retentionStartDate);
        const Contact = this.DataSubject;
        switch (data.purposeStatus) {
            case 0:
                if (deletionDate <= retentionStartDate) {
                    // hard delete
                    let contactEntries = await DELETE.from(Contact).where`id = ${data.dataSubjectId}`;

                    // soft delete
                    let drmEntries = await DELETE.from(drmEntity)
                        .where`applicationGroupName = ${data.applicationGroup}
                            and dataSubjectRole = ${data.dataSubjectRole}
                            and dataSubjectID = ${data.dataSubjectId}`;
                    if (contactEntries > 0 || drmEntries > 0) {
                        res.status(200).json("Contact deleted successfully");
                    } else {
                        res.status(200).json("No contact deleted");
                    };
                }
                else {
                    // soft delete
                    let contactEntryNumber = await UPDATE(Contact).where`id = ${data.dataSubjectId}`
                        .with`status_code = ${BlockStatus}`;
                    if (contactEntryNumber == 0) {
                        res.status(200).json("Contact is not found");
                        return;
                    }

                    let drmEntries = await SELECT.from(drmEntity)
                        .where`applicationGroupName = ${data.applicationGroup}
                    and dataSubjectRole = ${data.dataSubjectRole}
                    and dataSubjectID = ${data.dataSubjectId}`;

                    if (drmEntries.length === 0) {
                        // insert if no soft delete entry
                        await INSERT.into(drmEntity).entries(
                            {
                                applicationGroupName: data.applicationGroup,
                                dataSubjectRole: data.dataSubjectRole,
                                dataSubjectID: data.dataSubjectId,
                                maxDeletionDate: deletionDate
                            }
                        );
                        // if (drmEntries.length > 0) {
                        res.status(200).json("Contact blocked successfully");
                        // }
                    } else {
                        let drmEntryNumber = await UPDATE(drmEntity)
                            .where`applicationGroupName = ${data.applicationGroup}
                                and dataSubjectRole = ${data.dataSubjectRole}
                                and dataSubjectID = ${data.dataSubjectId};`
                            .with`maxDeletionDate = ${deletionDate}`;
                        if (drmEntryNumber > 0) {
                            res.status(200).json("Contact blocked successfully");
                        }
                    }
                }
                break;
            case 1:
                // the data subject should not be blocked or deleted 
                break;
            default:
                // do nothing
                break;
        }
    }

    async getDataSubjectLastRetentionStartDates(dataSubjectRetentionStartDate) {
        try {
            if (dataSubjectRetentionStartDate.dataSubjectRole === DataSubjectRoles.CONTACT) {
                // Set options
                const options = {
                    columns: [dataSubjectRetentionStartDate.startTime, "id"],
                    where: [{ ref: ["id"] }, "=", { val: dataSubjectRetentionStartDate.dataSubjectID }],
                    limit: { rows: { val: 1 } },
                };
                options.orderBy = [{ ref: [dataSubjectRetentionStartDate.startTime], sort: "desc", }];

                let result = null;
                const contactPersons = await SELECT("*").from(this.DataSubject)
                    .where(options.where).orderBy(options.orderBy).limit(options.limit);

                if (contactPersons.length) {
                    result = [{
                        retentionID: dataSubjectRetentionStartDate.rulesConditionSet[0].retentionID,
                        retentionStartDate: contactPersons[0][dataSubjectRetentionStartDate.startTime].substring(0, 19),
                    }];
                }
                return result;
            }
        } catch (err) {
            // this.handleError( err, logger,
            //     `failed to get last retention start ${dataSubjectRetentionStartDate.legalEntity}`
            // );
            this.logger.error(err.message);
        }
    }

    /**
     * Check if the data subject has expired (End of Business) or not
     * @param {*} dataSubjectInfo 
     */
    async checkDataSubjectEndOfBusiness(dataSubjectInfo, res) {
        //for now, all contacts shall reach EoB as no business process defined yet 
        let reply = {
            dataSubjectExpired: true, //If data subject reached EoB=>true, otherwise false
            dataSubjectNotExpiredReason: "",
        };
        if (
            dataSubjectInfo.dataSubjectRole === DataSubjectRoles.CONTACT &&
            dataSubjectInfo.legalGround === LegalGrounds.CONTACT_IN_MASTERDATA_MANAGEMENT
        ) {
            res.status(200).send(reply);
        }
        else {
            reply.dataSubjectExpired = false;
            // to-do: handle error message this.ResourceManager.getText()
            reply.dataSubjectNotExpiredReason = "Legal Ground or Data Subject Role is not valid";
            res.status(403).send(reply);
        }
    }

    /**
     * Get End of Residence data subjects
     * @param {*} dataSubjectEndofResidence 
     * @returns 
     */
    async getDataSubjectsEndofResidence(dataSubjectEndofResidence) {
        // retentionSchemas.dataSubjectsEndofResidenceBodyValidator.check(dataSubjectEndofResidence);
        let successResult = { "success": [] };

        try {
            if (dataSubjectEndofResidence.dataSubjectRole === DataSubjectRoles.CONTACT) {
                // Build an legalEntity to residenceDate object.
                const legalEntityToResidenceDate =
                    dataSubjectEndofResidence.legalEntitiesResidenceRules.reduce((acc, currValue) => {
                        if (currValue.residenceRules.length !== 1) {
                            throw new CommonError(
                                `Unexpected condition(s) for Legal Entity ${currValue.legalEntity}`, 400
                            );
                        }
                        acc[currValue.legalEntity] = currValue.residenceRules[0].residenceDate;
                        return acc;
                    }, {});

                // have to send back all soft deleted contacts above endofResidence of the Legal Entity
                // const subjectsToKeep  = new Set();
                const subjectsNotUsed = new Set();

                for (const legalEntity in legalEntityToResidenceDate) {
                    const residenceDate = legalEntityToResidenceDate[legalEntity];
                    // Get the Contacts which modifyAt is older then residenceDate
                    // No need to get subjectsToKeep for filter as we has no business order for now
                    const where = [{ ref: [dataSubjectEndofResidence.startTime] }, "<", { val: residenceDate }];
                    const contactPersons = await SELECT("*").from(this.DataSubject).where(where);
                    contactPersons.map(contactPerson => subjectsNotUsed.add(contactPerson.id));
                }

                for (let subjectNotUsed of Array.from(subjectsNotUsed)) {
                    const cont = { "dataSubjectID": subjectNotUsed };
                    successResult.success.push(cont);
                }

                return {
                    successResult,
                };
            }
        } catch (err) {
            // this.handleError(err, logger, "failed to list data subjects end of residence");
            this.logger.error(err.message);
        }
    };

    /**
     * Block (soft delete) the data subject if maxDeletionDate > today;
     * Destroy (hard delete) the data subject if maxDeletionDate <= today
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @param {*} DrmEntity 
     * @returns 
     */
    async onDeleteDataSubject(req, DrmEntity) {

        let blockRows, contactEntry, deleteRows;
        try {
            const existedContact = await SELECT.one.from(this.DataSubject, req.data.dataSubjectID);
            if (existedContact) {
                /*block*/
                if (new Date(req.data.maxDeletionDate) > new Date()) {
                    // eslint-disable-next-line camelcase
                    blockRows = await UPDATE(this.DataSubject).set({ status_code: BlockStatus }).
                        where({ id: req.data.dataSubjectID });
                    if (blockRows) {
                        /*change log*/
                        this.changelog.activeOrDeactivateChangeLog(
                            existedContact,
                            this.DataSubject,
                            BlockStatus
                        );
                        let drmEntities = await SELECT.from(DrmEntity).where({
                            applicationGroupName: req.data.applicationGroupName,
                            dataSubjectRole: req.data.dataSubjectRole,
                            dataSubjectID: req.data.dataSubjectID
                        });
                        if (drmEntities?.length) {
                            await UPDATE(DrmEntity).set({ maxDeletionDate: req.data.maxDeletionDate }).
                                where({
                                    applicationGroupName: req.data.applicationGroupName,
                                    dataSubjectRole: req.data.dataSubjectRole,
                                    dataSubjectID: req.data.dataSubjectID
                                });
                        } else {
                            await INSERT.into(DrmEntity).entries(req.data);
                        };
                    }
                } else {
                    /*Destroy*/
                    contactEntry = await SELECT.one.from(this.DataSubject).
                        // eslint-disable-next-line camelcase
                        where({ id: req.data.dataSubjectID, status_code: BlockStatus });
                    if (contactEntry) {
                        deleteRows = await DELETE.from(this.DataSubject).where({ id: contactEntry.id });
                        if (deleteRows) {
                            /*change log*/
                            this.changelog.deleteChangeLog(contactEntry, this.DataSubject);
                            await DELETE.from(DrmEntity).
                                where({ dataSubjectID: contactEntry.id });
                        }
                    }
                };
            };

            /*message*/
            if (blockRows) {
                this.logger.info(Logger.BLOCK_SUCCESS);
                req.res.status(200).json(Logger.BLOCK_SUCCESS);
            } else if (deleteRows) {
                this.logger.info(Logger.DELETE_SUCCESS);
                req.res.status(200).json(Logger.DELETE_SUCCESS);
            } else {
                this.logger.info(Logger.BLOCK_NOTHING);
                req.res.status(200).json(Logger.BLOCK_NOTHING);
            };
        } catch (err) {
            this.logger.error(err.message);
            throw new CommonError(err.message, 400);
        }
    };

    /**
     * Destroy (hard delete) the data subjects whose maxDeletionDate <= today
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @param {*} DrmEntity 
     * @returns 
     */
    async onDestroyDataSubjects(req, DrmEntity) {
        try {
            let drmRows;
            /*check drmEntry for deletion*/
            let drm = await SELECT.from(DrmEntity).
                where({
                    applicationGroupName: req.data.applicationGroupName,
                    dataSubjectRole: req.data.dataSubjectRole
                });
            if (drm?.length) {
                /*compare maxDeletionDate with current date*/
                let drmEntities = drm.filter((drmEntry) => {
                    return new Date(drmEntry.maxDeletionDate)
                        <= new Date();
                });

                /*delete DataSubject & DrmEntity*/
                if (drmEntities?.length) {
                    let existedContact = await SELECT.from(this.DataSubject).
                        where({
                            id: { in: drmEntities.map((entry) => entry.dataSubjectID) }
                            // eslint-disable-next-line camelcase
                            , status_code: BlockStatus
                        });
                    if (existedContact?.length) {
                        drmRows = await DELETE.from(this.DataSubject)
                            .where({ id: { in: existedContact.map((entry) => entry.id) } });
                        /*change log*/
                        existedContact.forEach((entry) => this.changelog.deleteChangeLog(entry, this.DataSubject));
                        if (drmRows) {
                            await DELETE.from(DrmEntity).
                                where({ dataSubjectID: { in: existedContact.map((entry) => entry.id) } });
                        };
                    }
                };
            };
            /*message*/
            if (drmRows) {
                this.logger.info(Logger.DESTROY_SUCCESS);
                req.res.status(202).json(Logger.DESTROY_SUCCESS);
            } else {
                this.logger.info(Logger.DESTROY_NOTHING);
                req.res.status(202).json(Logger.DESTROY_NOTHING);
            };
        } catch (err) {
            this.logger.error(err.message);
            throw new CommonError(err.message, 400);
        }
    };
}

module.exports = { DRMHandler };
