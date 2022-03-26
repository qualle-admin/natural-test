import wordnet from "wordnet";

export const list = async () => {
  await wordnet.init();

  return await wordnet.list();
};
