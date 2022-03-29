import { SentimentAnalyzer, PorterStemmer } from "natural";

const analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");

export const getSentiment = (tokens) => {
  const sentiment = analyzer.getSentiment([...tokens]);

  return sentiment === 0 || sentiment > 0.6;
};
