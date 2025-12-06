/*
  - user:system owns profile:master and all company provided profile:{state:ProfileState.TEMPLATE}.
  - profile:master contains Heads/Tags/Sources that are shared across all users' all profiles.
*/

const prodUserIds = {};

const testUserIds = {
  system: "0woACRqrilQp6jrYXvzKnt9mhfS2",
  prashant: "7Kel7qWNvgZbnxEMn4t9Hz94mwF3",
  khushi: "xRR312Jvj1SAquMiTfg7ics31MQ2",
};

const prodProfileIds = {};

const testProfileIds = {
  // system
  master: "68aa204fec79ca3085826092",
  student: "68aac67dd675f98cf45d2296",
  professional: "68b82445242783cdd7f9467c",
  businessman: "68b98ef15e4c8cbc2d59dced",
  // users
  prashant: "68aac5697a43917f32702447",
  khushi: "68ac327268b3f14414f88d6b",
};

const testBookIds = {
  // users
  prashant: "68fda3e0b4e4e4a171cbee14",
};

const prodBookIds = {};

const testHeadIds = {
  // users
  prashant: "68fde0a5493f587b65931fcb",
};

const prodHeadIds = {};

const testTagIds = {
  // users
  prashant: "68fde0cdf00bbca6b3ef04eb",
};

const prodTagIds = {};

export default process.env.STAGE === "gamma" || process.env.STAGE === "prod"
  ? { user: prodUserIds, profile: prodProfileIds, book: prodBookIds, head: prodHeadIds, tag: prodTagIds }
  : { user: testUserIds, profile: testProfileIds, book: testBookIds, head: testHeadIds, tag: testTagIds };
