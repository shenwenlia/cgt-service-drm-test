"use strict";

const Constants = require("./Constants");
const { Changelog } = cds.entities(Constants.CHANGELOG_PATH);
const ENABLE_ANNOTATION = "@CGT.changelog.enabled";
const ENTITY_ID_ANNOTATION = "@CGT.changelog.entityId";

class ChangelogDBHelper {
    async activeOrDeactivateChangeLog(data, entity, newValue) {
        const properties = Object.keys(data);
        const tempEntityId = this.getEntityId(properties, data, entity);
        const entry = {
            entityId: tempEntityId,
            // eslint-disable-next-line camelcase
            actionMethod_code: "BLOCK",  
            // eslint-disable-next-line camelcase
            entityName_code: this._getEntityName(entity),
            newValue,
            oldValue: data["status_code"],
            // eslint-disable-next-line camelcase
            attribute_code: "status_code",  
            attributeType: typeof data["status_code"],
        };
        await INSERT.into(Changelog).entries(entry);
    }

    /**
     * before create or update add change log
     *
     * @param {object} req The request
     * @param {entity} entity the entity of db operate
     */
    async deleteChangeLog(data, entity) {
        console.log(data);
        const properties = Object.keys(data);
        const tempEntityId = this.getEntityId(properties, data, entity);
        const baseEntry = {
            entityId: tempEntityId,
            // eslint-disable-next-line camelcase
            actionMethod_code: "DELETE",
            // eslint-disable-next-line camelcase
            entityName_code: this._getEntityName(entity),
            oldValue: data["id"],
            // eslint-disable-next-line camelcase
            attribute_code: "id",
            attributeType: typeof data["id"],
        };
        const changeLogArr = [];
        changeLogArr.push(baseEntry);
        if (changeLogArr?.length) {
            await INSERT.into(Changelog).entries(changeLogArr[0]);
        }
    }

    getEntityId(properties, data, entity) {
        const idFiledName = properties.find(
            (t) => entity.elements[t][ENTITY_ID_ANNOTATION]
        );
        return data[idFiledName] || data.id || data.ID;
    }

    _getEntityName(entity) {
        return entity.name.split(".").pop();
    }
}

module.exports = { ChangelogDBHelper };
