import { Spellcheck, WordTokenizer } from "natural";

import { getSentiment } from "./helpers/sentiment";

import { list } from "./helpers/dictionary";
import { includeWords, excludeWords } from "./constants";

import { differenceWith, isEqual } from "lodash";

import { approved as approvedMock, declined as declinedMock } from "./mocks";

export const process = async (input) => {
  const tokenizer = new WordTokenizer();
  const corpus = await list();

  // body context
  const bodyContext = input.match(/(.+)((\r?\n.+)*){1}/m)[0];

  // tokenize response
  const tokens = tokenizer
    .tokenize(bodyContext)
    .map((token) => token.toLocaleLowerCase())
    .filter(token => isNaN(token) && includeWords.includes(token));

  // load corpus
  const spellcheck = new Spellcheck(corpus);

  // spell corrections
  const correctedTokens = tokens.flatMap((token) =>
    spellcheck.isCorrect(token) ? token : spellcheck.getCorrections(token, 1)[0]
  );

  // filter conjunctions
  const preparedCorrectedTokens = differenceWith(correctedTokens.filter((token) =>
    correctedTokens.includes(token)
  ), excludeWords, isEqual);

  const orgId = input.match(/(?!\[[org\:]\s)[0-9a-f]{28}(?=\])/g)[0];
  const containers = input.match(/([A-z]{4}\d{6,7})+/g);

  console.log(preparedCorrectedTokens);

  // filter duplicate containers
  const filteredContainers = containers
    .filter((container, index) =>
      !containers.includes(container, index + 1));

  const approvedContainers = [];
  const declinedContainers = [];

  const reasonCode = new RegExp(`.*(${includeWords.join('|')}).[^\\\n]*`, 'i')
  const reason = String(bodyContext.match(reasonCode)[0]).replace(/\n/g, '').trim();

  // console.log('reasonCode: ', reasonCode);

  if (getSentiment([...preparedCorrectedTokens])) {
    approvedContainers.push(...filteredContainers.map((container) => ({ container })));
  } else {
    declinedContainers.push(
      ...filteredContainers.map((container) => ({ container, reason }))
    );
  }

  return {
    orgId,
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
