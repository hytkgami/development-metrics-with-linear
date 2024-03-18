import { LinearClient, LinearDocument } from '@linear/sdk';

const fetchCompletedCycles = async (
  client: LinearClient,
  baseDate: Date,
  team: string
) => {
  const limit = 20;
  const cycles = await client.cycles({
    first: limit,
    orderBy: LinearDocument.PaginationOrderBy.CreatedAt,
    filter: {
      completedAt: {
        gte: baseDate,
      },
      team: {
        name: {
          eq: team,
        },
      },
    },
  });
  return cycles.nodes.map((cycle) => {
    const scope = cycle.scopeHistory.pop() ?? 0;
    const completedScope = cycle.completedScopeHistory.pop() ?? 0;
    let completedRatio = 0;
    if (scope > 0) {
      completedRatio = (completedScope / scope) * 100;
    }
    return {
      name: cycle.name,
      completedRatio: completedRatio,
      scope: scope,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
    };
  });
};

type Args = {
  team: string;
  date: Date;
};

const validateArgs = (args: string[]): Args => {
  // 第1引数にチーム名が指定されているかを確認
  if (args.length < 1) {
    throw new Error('Please specify the team name');
  }
  // 第2引数に日付が指定されているかを確認
  if (args.length < 2) {
    throw new Error('Please specify the date');
  }
  // 第2引数が日付形式かを確認
  const date = new Date(args[1]);
  if (isNaN(date.getTime())) {
    throw new Error(
      'Invalid date format. Please specify the date in ISO8601 format (e.g. 2024-01-01T00:00:00+09:00)'
    );
  }
  return {
    team: args[0],
    date: date,
  };
};

(async () => {
  const apiKey = process.env.LINEAR_API_KEY;
  const linearClient = new LinearClient({ apiKey });
  const args = process.argv.slice(2);
  try {
    const { team, date } = validateArgs(args);
    const result = await fetchCompletedCycles(linearClient, date, team);
    console.log(result);
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      return;
    }
    console.error(e);
  }
})();
