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
  daysSinceLastAttempt: number | null;
  latestMemoryInterval: number | string;
  potentialMemoryGainMultiplier: number | string;
  potentialMemoryGainInDays: number | string;
  attemptsSummary: {
    total: number;
    withoutHelp: number;
    withHelp: number;
  };

  constructor(dbData: any) {
    // Assign data from the database record
    this.question_number = dbData.question_number;
    this.discipline = dbData.discipline;
    this.source = dbData.source;
    this.description = dbData.description;
    this.proposition = dbData.proposition;
    this.step_by_step = dbData.step_by_step;
    this.answer = dbData.answer;
    this.tags = dbData.tags
      ? dbData.tags.split(",").map((tag: string) => tag.trim())
      : [];

    const codeVec: number[] = JSON.parse(dbData.code_vec_json || "[]");
    const dateVec: string[] = JSON.parse(dbData.date_vec_json || "[]");
    this.attempts = codeVec.map((code, index) => ({
      code: code,
      date: new Date(dateVec[index]),
    }));

    // Initialize calculated properties
    this.daysSinceLastAttempt = this.calculateDaysSinceLastAttempt();
    this.attemptsSummary = this.calculateAttemptsSummary(codeVec);

    // The logic from calculateLatestMemoryIntervalAndPotentialGain is now directly in the constructor
    // to satisfy TypeScript's strict initialization rules.
    if (this.attempts.length === 0) {
      this.latestMemoryInterval = STATUS_NA;
      this.potentialMemoryGainMultiplier = STATUS_NA;
      this.potentialMemoryGainInDays = STATUS_NA;
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

      const lastCode = codeVec[codeVec.length - 1];
      const daysSinceLast = this.daysSinceLastAttempt;

      if (daysSinceLast === null) {
        // This case should ideally not be hit if attempts > 0, but it's a safeguard.
        this.latestMemoryInterval = STATUS_NA;
        this.potentialMemoryGainMultiplier = STATUS_NA;
        this.potentialMemoryGainInDays = STATUS_NA;
      } else if (lastCode === 1 && codeVec.length === 1) {
        this.latestMemoryInterval = STATUS_SA;
        this.potentialMemoryGainMultiplier = STATUS_SA;
        this.potentialMemoryGainInDays = daysSinceLast;
      } else if (memoryIntervals.length === 0 || lastCode === 0) {
        this.latestMemoryInterval = STATUS_WH;
        this.potentialMemoryGainMultiplier = STATUS_WH;
        this.potentialMemoryGainInDays = daysSinceLast;
      } else {
        const lastInterval = memoryIntervals[memoryIntervals.length - 1];
        const latestInterval = lastInterval === 0 ? 1 : lastInterval;
        this.latestMemoryInterval = latestInterval;
        this.potentialMemoryGainMultiplier = parseFloat(
          (daysSinceLast / latestInterval).toFixed(2)
        );
        this.potentialMemoryGainInDays = daysSinceLast - latestInterval;
      }
    }
  }

  private calculateDaysSinceLastAttempt(): number | null {
    if (this.attempts.length === 0) {
      return null;
    }
    const lastAttemptDate = this.attempts[this.attempts.length - 1].date;
    const today = new Date();
    // Set both dates to midnight to compare just the days
    lastAttemptDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastAttemptDate.getTime();
    return Math.floor(diffTime / MS_PER_DAY);
  }

  private calculateAttemptsSummary(code_vector: number[]) {
    const withoutHelp = code_vector.filter((c) => c === 1).length;
    const withHelp = code_vector.filter((c) => c === 0).length;
    return {
      total: withoutHelp + withHelp,
      withoutHelp,
      withHelp,
    };
  }
}
