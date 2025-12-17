import mongoose from "mongoose";

async function connect() {
  await mongoose.connect(
    `mongodb+srv://${process.env.MONGODB_URL}?retryWrites=true&w=majority`,
  );
  console.log(
    `🔗 MongoDB is connected (${process.env.MONGODB_URL.split("@")[1]})`,
  );
}

export { connect as initialiseDbConnection };
