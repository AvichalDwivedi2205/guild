export type ScreenRevisionSnapshot = {
  screenKey: string;
  route: string;
  viewports: readonly string[];
};

export type CommentClassification = 'addressed' | 'carried' | 'detached';

export function changedScreens(
  previous: readonly ScreenRevisionSnapshot[],
  next: readonly ScreenRevisionSnapshot[],
): string[] {
  const previousByKey = new Map(previous.map((screen) => [screen.screenKey, screen]));
  return next
    .filter((screen) => {
      const prior = previousByKey.get(screen.screenKey);
      if (!prior) return true;
      return (
        prior.route !== screen.route || prior.viewports.join(',') !== screen.viewports.join(',')
      );
    })
    .map((screen) => screen.screenKey);
}

export function classifyRevisionComment(input: {
  addressedCommentIds: readonly string[];
  commentId: string;
  screenChanged: boolean;
  sameScreenExists: boolean;
}): CommentClassification {
  if (input.addressedCommentIds.includes(input.commentId)) return 'addressed';
  if (!input.sameScreenExists) return 'detached';
  if (input.screenChanged) return 'carried';
  return 'carried';
}
