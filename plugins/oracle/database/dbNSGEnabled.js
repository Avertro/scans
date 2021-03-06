var async = require('async');
var helpers = require('../../../helpers/oracle');

module.exports = {
    title: 'DB Network Security Groups Enabled',
    category: 'Database',
    description: 'Ensures that all databases have network security groups enabled.',
    more_info: 'Enabling network security groups on database systems allow for fine grain control over network access to the database, ensuring databases are only accessible from trusted entities and following security best practices.',
    link: 'https://docs.cloud.oracle.com/iaas/Content/Database/Tasks/backingupOS.htm',
    recommended_action: '1. Enter the database service. 2. Select the database system. 3. In the system information, edit the network security groups and select the appropriate network security group.',
    apis: ['dbSystem:list'],

    run: function(cache, settings, callback) {
        var results = [];
        var source = {};
        var regions = helpers.regions(settings.govcloud);

        async.each(regions.dbSystem, function(region, rcb){

            if (helpers.checkRegionSubscription(cache, source, results, region)) {

                var databases = helpers.addSource(cache, source,
                    ['dbSystem', 'list', region]);

                if (!databases) return rcb();

                if ((databases.err && databases.err.length) || !databases.data) {
                    helpers.addResult(results, 3,
                        'Unable to query for database systems: ' + helpers.addError(databases), region);
                    return rcb();
                }

                if (!databases.data.length) {
                    helpers.addResult(results, 0, 'No database systems present', region);
                    return rcb();
                }

                var allEnabled = true;

                databases.data.forEach(database => {
                    if (database.lifecycleState === "AVAILABLE") {
                        if (!database.nsgIds ||
                            (database.nsgIds &&
                            !database.nsgIds.length)) {
                            helpers.addResult(results, 2, 'The database system does not have network security groups enabled', region, database.id);
                            allEnabled = false;
                        }
                    }
                });

                if (allEnabled) {
                    helpers.addResult(results, 0,
                        'All database systems have network security groups enabled', region);
                }
            }

            rcb();
        }, function(){
            // Global checking goes here
            callback(null, results, source);
        });
    }
};