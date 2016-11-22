import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("persistence > multi primary keys", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    describe("insert", function () {

        it("should insert entity when when there are multi column primary keys", () => Promise.all(connections.map(async connection => {
            const post1 = new Post();
            post1.title = "Hello Post #1";
            post1.firstId = 1;
            post1.secondId = 2;

            await connection.entityManager.persist(post1);

            // create first category and post and save them
            const category1 = new Category();
            category1.name = "Category saved by cascades #1";
            category1.posts = [post1];

            await connection.entityManager.persist(category1);

            // now check
            const posts = await connection.entityManager.find(Post, {
                alias: "post",
                innerJoinAndSelect: {
                    category: "post.category"
                },
                orderBy: {
                    "post.firstId": "ASC"
                }
            });

            posts.should.be.eql([{
                firstId: 1,
                secondId: 2,
                title: "Hello Post #1",
                category: {
                    categoryId: 1,
                    name: "Category saved by cascades #1"
                }
            }]);
        })));
    });
});