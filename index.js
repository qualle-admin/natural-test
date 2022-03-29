import { Spellcheck, WordTokenizer } from "natural";

import { getSentiment } from "./helpers/sentiment";

import { list } from "./helpers/dictionary";
import { reasonCodes, excludeWords } from "./constants";

import { differenceWith, isEqual } from "lodash";

import { approved as approvedMock, declined as declinedMock } from "./mocks";

export const process = async (input) => {
  const tokenizer = new WordTokenizer();
  const corpus = await list();

  const tokens = tokenizer
    .tokenize(input.match(/^(.*)$/m)[0])
    .map((token) => token.toLocaleLowerCase());

  // load corpus
  const spellcheck = new Spellcheck(corpus);

  // spell corrections
  const correctedTokens = tokens.flatMap((token) =>
    spellcheck.isCorrect(token) ? token : spellcheck.getCorrections(token, 1)[0]
  );

  const preparedCorrectedTokens = differenceWith(correctedTokens.filter((token) =>
    correctedTokens.includes(token)
  ), excludeWords, isEqual);

  console.log(preparedCorrectedTokens);

  const mc = input.match(/([MC]+\d{6})+/g);
  const containers = input.match(/([A-z]{4}\d{6,7})+/g);

  const approvedContainers = [];
  const declinedContainers = [];

  // reason code
  const reasonCode = Object.keys(reasonCodes).filter((r) =>
    preparedCorrectedTokens.includes(r)
  )[0];

  const reason = reasonCodes[reasonCode] || null;

  if (getSentiment([...preparedCorrectedTokens])) {
    approvedContainers.push(...containers.map((container) => ({ container })));
  } else {
    declinedContainers.push(
      ...containers.map((container) => ({ container, reason }))
    );
  }

  return {
    mc,
    approved: [...approvedContainers],
    declined: [...declinedContainers],
  };
};

(async () => {
  const approvedResult = await process(approvedMock);
  console.log("Approved result: ", approvedResult);

  const declinedResult = await process(declinedMock);
  console.log("Declined result: ", declinedResult);
})();
