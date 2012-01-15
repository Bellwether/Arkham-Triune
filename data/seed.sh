mongo --version
mongoimport --file fixtures/tiles.json -vvv --db arkhamtriune --collection tiles --upsert --upsertFields name --jsonArray --stopOnError --type json
mongoimport --file fixtures/items.json -vvv --db arkhamtriune --collection items --upsert --upsertFields name --jsonArray --stopOnError --type json