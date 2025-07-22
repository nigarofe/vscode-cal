import matter from "gray-matter";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STATUS_NA = "NA";
const STATUS_SA = "SA";
const STATUS_WH = "W/H";

export class Question {
  // From DB
  question_number: number;
  discipline: string;
  source: string;
  description: string;
  proposition: string;
  step_by_step: string | null;
  answer: string;
  tags: string[];
  attempts: { code: number; date: Date }[];

  // Calculated properties
  daysSinceLastAttempt: number | string;
  latestMemoryInterval: number | string;
  potentialMemoryGainMultiplier: number | string;
  potentialMemoryGainInDays: number | string;
  attemptsWithoutHelp: number;
  attemptsWithHelp: number;
  attemptsSummary: string;

  constructor(dbData: any) {
    // Assign data from the database record
    this.question_number = dbData.question_number;
    this.discipline = dbData.discipline;
    this.source = dbData.source;
    this.description = dbData.description;
    this.proposition = dbData.proposition;
    this.step_by_step = dbData.step_by_step;
    this.answer = dbData.answer;
    this.tags = Array.isArray(dbData.tags)
      ? dbData.tags
      : dbData.tags
        ? dbData.tags.split(",").map((tag: string) => tag.trim())
                : [];


    const codeVec: number[] = JSON.parse(dbData.code_vec_json);
    const dateVec: string[] = JSON.parse(dbData.date_vec_json);

    if (codeVec.length === 1 && codeVec[0] === null) {
      this.attempts = [];
    } else {
      this.attempts = codeVec.map((code, index) => ({
        code: code,
        date: new Date(dateVec[index]),
      }));
    }

    this.attemptsWithoutHelp = codeVec.filter((c) => c === 1).length;
    this.attemptsWithHelp = codeVec.filter((c) => c === 0).length;

    if (this.attempts.length === 0) {
      this.daysSinceLastAttempt = STATUS_NA;
      this.latestMemoryInterval = STATUS_NA;
      this.potentialMemoryGainMultiplier = STATUS_NA;
      this.potentialMemoryGainInDays = STATUS_NA;
      this.attemptsSummary = STATUS_NA;
    } else {
      this.daysSinceLastAttempt = this.calculateDaysSinceLastAttempt();
      this.attemptsSummary = this.calculateAttemptsSummary(codeVec);

      const lastCode = codeVec[codeVec.length - 1];
      if (lastCode === 0) {
        this.latestMemoryInterval = STATUS_WH;
        this.potentialMemoryGainMultiplier = STATUS_WH;
        this.potentialMemoryGainInDays = this.daysSinceLastAttempt;
      } else if (lastCode === 1 && codeVec.length === 1) {
        this.latestMemoryInterval = STATUS_SA;
        this.potentialMemoryGainMultiplier = STATUS_SA;
        this.potentialMemoryGainInDays = this.daysSinceLastAttempt;
      } else {
        const memoryIntervals: number[] = [];
        for (let j = 1; j < codeVec.length; j++) {
          if (codeVec[j] === 1) {
            const prev = new Date(dateVec[j - 1]);
            const curr = new Date(dateVec[j]);
            const interval = Math.floor(
              (curr.getTime() - prev.getTime()) / MS_PER_DAY
            );
            memoryIntervals.push(interval);
          }
        }
        const lastInterval = memoryIntervals[memoryIntervals.length - 1];
        const latestInterval = lastInterval === 0 ? 1 : lastInterval;
        this.latestMemoryInterval = latestInterval;
        this.potentialMemoryGainMultiplier = parseFloat(
          ((this.daysSinceLastAttempt as number) / latestInterval).toFixed(2)
        );
        this.potentialMemoryGainInDays = (this.daysSinceLastAttempt as number) - latestInterval;
      }
    }
  }

  private calculateDaysSinceLastAttempt(): number {
    const lastAttemptDate = this.attempts[this.attempts.length - 1].date;
    const today = new Date();
    // Set both dates to midnight to compare just the days
    lastAttemptDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastAttemptDate.getTime();
    return Math.floor(diffTime / MS_PER_DAY);
  }

  private calculateAttemptsSummary(code_vector: number[]) {
    return `${this.attemptsWithoutHelp + this.attemptsWithHelp}; ${this.attemptsWithoutHelp}; ${this.attemptsWithHelp}`;
  }

  public generateContentFromQuestion(): string {
    const tags = Array.isArray(this.tags) ? JSON.stringify(this.tags) : this.tags;
    return `---
discipline: ${JSON.stringify(this.discipline)}
description: ${JSON.stringify(this.description)}
source: ${JSON.stringify(this.source)}
tags: ${tags}
---

# Question ${this.question_number}

## Proposition
${this.proposition}

## Step-by-step
${this.step_by_step || ""}

## Answer
${this.answer}
`;
  }

  static _parseFromText(text: string): Partial<Question> {
    const parsed = matter(text);
    const content = parsed.content;

    const questionNumberMatch = content.match(/^# Question (\d+)/im);
    const question_number = questionNumberMatch
      ? parseInt(questionNumberMatch[1], 10)
      : -1;

    let proposition = "";
    let step_by_step = "";
    let answer = "";

    const propositionContent = content.split("## Proposition")[1];
    if (propositionContent) {
      if (propositionContent.includes("## Step-by-step")) {
        const stepByStepSplit = propositionContent.split("## Step-by-step");
        proposition = stepByStepSplit[0].trim();
        const answerSplit = stepByStepSplit[1].split("## Answer");
        step_by_step = answerSplit[0].trim();
        answer = answerSplit[1] ? answerSplit[1].trim() : "";
      } else {
        const answerSplit = propositionContent.split("## Answer");
        proposition = answerSplit[0].trim();
        answer = answerSplit[1] ? answerSplit[1].trim() : "";
      }
    }

    return {
      question_number,
      discipline: parsed.data.discipline,
      source: parsed.data.source,
      description: parsed.data.description,
      tags: parsed.data.tags,
      proposition,
      step_by_step,
      answer,
    };
  }

  static fromText(text: string): Question {
    const parsedData = Question._parseFromText(text);
    const dbData = {
      question_number: parsedData.question_number,
      discipline: parsedData.discipline,
      source: parsedData.source,
      description: parsedData.description,
      proposition: parsedData.proposition,
      step_by_step: parsedData.step_by_step,
      answer: parsedData.answer,
      tags: parsedData.tags ? (parsedData.tags as string[]).join(", ") : "",
      code_vec_json: '[]',
      date_vec_json: '[]'
    };
    return new Question(dbData);
  }

  static validate(questionData: Question): string[] {
    const errors: string[] = [];
    if (questionData.question_number === -1) {
      errors.push("Question number not found in the document.");
    }
    if (!questionData.proposition) {
      errors.push("'## Proposition' section not found.");
    }
    if (!questionData.answer) {
      errors.push("'## Answer' section not found.");
    }
    return errors;
  }
}
