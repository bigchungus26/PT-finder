export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function trainerShareMessage(trainerName: string, neighborhood: string, slug: string): string {
  return `I found an amazing trainer on Kotch 💪 Check out ${trainerName} in ${neighborhood} — https://kotch.app/t/${slug}`;
}

export function referralShareMessage(referralLink: string): string {
  return `Join me on Kotch — the app I use to find personal trainers in Lebanon. Use my link to sign up: ${referralLink}`;
}

export function challengeShareMessage(challengeName: string, trainerName: string, challengeLink: string): string {
  return `I'm doing ${challengeName} with my trainer ${trainerName} on Kotch. Join me: ${challengeLink}`;
}

export function milestoneShareMessage(count: number): string {
  return `I just completed my ${count}${count === 1 ? 'st' : count === 2 ? 'nd' : count === 3 ? 'rd' : 'th'} training session on Kotch 💪 #KotchFit`;
}
