# cgt-service-drm
CGT Business Configuration Data Services

### Local Deploy and Test Using sqlite

Execute the deploy command:

    cds deploy --to sqlite:..\\SQL-Scripts\\cgt-udm.sqlite --no-save
    cds deploy --to hana --vcap-file ./default-env.json --no-save

This will insert these lines in the module's package.json under cds.requires if '--no-save' option is omitted:
    "cds": {
        "requires": {
            "db": {
                "kind": "sqlite",
                "model": ["model","service"],
                "credentials": {
                "database": "..\\SQL-Scripts\\cgt-udm.sqlite"
                }
            }
        }
    }

Connect to the database file "..\\SQL-Scripts\\cgt-udm.sql" using SQLTools and explore the tables and view. In case it does not work, add those lines manually and re-depoly. 

## Build and deploy for single tenant

npm install (install dependency package)

    cf login -a https://api.cf.eu12.hana.ondemand.com (login BTP)

mbt build -t . (build package according mta.yaml file)

    cf deploy  **.mtar -e=mta-single.mtaext (deploy package)


## Build and deploy for multi tenant

npm install (install dependency package)

    cf login -a https://api.cf.eu12.hana.ondemand.com (login BTP)

mbt build -t . (build package according mta.yaml file)

    cf deploy  **.mtar (deploy package)
# cgt-service-drm-test
