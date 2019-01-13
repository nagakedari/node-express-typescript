mongoimport --db adminconsole --collection users --file users.json --mode=upsert --upsertFields username --jsonArray
mongoimport --db adminconsole --collection appContexts --file appContexts.json --mode=upsert --upsertFields name --jsonArray
