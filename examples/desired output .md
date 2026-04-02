Bulk Import UI Changes Research Insight Report


Study overview
https://app.usertesting.com/workspaces/86864/study/5992401/sessions
This report synthesizes feedback from 5 UserTesting participants who reviewed the proposed bulk import reminder UI changes. The analysis is based on:
User test script
question-by-question-analysis.md
5 transcript files in Bulk import/UI Changes
The study objective was to understand whether the updated import flow is easy to use, whether the newer design direction improves confidence and reviewability, and which confirmation treatment works best inside Design B.
Important caveat
The transcript exports do not cleanly preserve every script question as a separate answer, and the existing balanced-order note appears unreliable for some participants. Because of that, the first two prototype rounds were analyzed conservatively, and the strongest weight in this report is placed on the later direct comparison questions where participants explicitly compared the designs.
Executive summary
The good news is that the core job to be done is working. Participants consistently found the import flow easy once they were in it, and nobody struggled with the idea of selecting occasions from their calendar.
The bigger issues are around clarity at the edges of the experience. Users were less concerned with the mechanics of adding reminders and more concerned with three things: finding the import route in the first place, feeling sure an event had actually been added, and scanning the list confidently without missing anything important.
Design B is the stronger direction overall. It was generally preferred because the filters and categorization make the list easier to review and give users more confidence that they will not overlook key occasions. That said, Design B is not ready as-is. It introduces visual clutter for some users, and there is still no universally resolved answer to the completion-state problem.
The clearest product direction is not a clean A-versus-B choice. It is a hybrid: keep Design B's structure and scanability benefits, simplify its presentation, and strengthen the add/confirmation affordance so users feel fully confident that the task is complete.
What the research says
1. The core import concept is strong
Participants generally understood the value of importing dates from an existing calendar and responded positively to how fast the flow could be. Several users described the interaction as very easy or easier than expected.
Implication
The team does not need to rethink the core idea. The opportunity is refinement, not redesign.
2. The biggest usability issue is not adding events, it is understanding the boundaries of the flow
Users did not struggle much with selecting items. They struggled more with:
recognizing that the floating + is the way to start importing
understanding whether an item was truly added
knowing whether another completion step was still required
This is a classic affordance and feedback problem rather than a feature-value problem.
Implication
Improving entry-point labeling and completion feedback is likely to have a bigger impact than changing the overall interaction model.
3. Design B is more effective for scanning and confidence
In the direct comparison, Design B was generally preferred overall. The reasons were consistent:
category filters make browsing easier
grouping by occasion type feels more organized
the interface feels more modern and visually engaging
users feel more confident they will not miss something important
This was especially strong in the "would not miss anything important" question, where Design B was the dominant choice.
Implication
The team should continue in the Design B direction rather than reverting to Design A.
4. Design A still wins on simplicity and speed for some users
Despite Design B's broader appeal, some participants still found Design A easier to use or quicker to review because it felt simpler, cleaner, and less busy. This was most visible among users who cared more about quickly seeing the next upcoming event than browsing by type.
Implication
Design B should not simply add more UI. It needs to preserve the speed and clarity that users valued in Design A.
5. Design B's biggest risk is visual noise
The strongest criticism of Design B was not that the structure was wrong. It was that the extra icons and UI elements made the screen feel busier than necessary. One participant explicitly wanted Design B without the icons. Others liked the categories but did not necessarily need every visual treatment layered on top.
Implication
The likely best version of B is a simplified B, not a more feature-rich B.
6. Confirmation language is still unresolved
The icon-versus-text comparison split the group almost evenly.
Users who trusted standard iconography preferred the icon treatment because it felt quicker and cleaner.
Users who wanted stronger confirmation preferred text because Added removed ambiguity and made the action feel complete.
This is not a superficial preference. It maps directly to user confidence.
Implication
The team should treat confirmation state as a core UX decision, not a visual polish detail.
7. There are useful secondary opportunities, but they are not the main blocker
Participants also mentioned:
Select all
manual add from within import
reminder timing controls
deeper import filtering
excluding existing Moonpig reminders from the imported list
recurring setup or address confirmation
These are useful enhancements, but they were not the main drivers of preference or friction in this study.
Implication
These should be sequenced after the core clarity issues are addressed.
Key user needs emerging from the study
The feedback points to a clear set of user needs:
Help me find the import flow immediately.
Let me scan imported events in a way that feels organized.
Make it obvious what has been added and what has not.
Do not make the screen feel busier than it needs to be.
Give me confidence without slowing me down.
Design recommendations
1. Proceed with Design B as the base direction
This is the clearest directional call from the research. Design B performs better on overall preference, confidence, and scanability.
2. Simplify Design B before rolling it forward
Keep:
category filters
clearer grouping by occasion type
improved reviewability
Reduce or reconsider:
decorative or redundant icons
any UI elements that add noise without improving task completion
optional controls such as search if they are not meaningfully helping in this flow
3. Make the import entry point more explicit
The floating + alone is too implicit for some users. This should be strengthened through clearer labeling, supporting copy, or a more explicit import affordance.
4. Strengthen completion feedback
This is the highest-priority interaction fix after entry-point clarity.
Possible directions:
keep Added text in the selected state
add a clearer completion pattern after multi-select
test a hybrid treatment where icon and text work together rather than forcing a binary choice
5. Clean up source logic and list states
Users noticed when existing Moonpig reminders appeared in the same view as imported calendar events. If that behavior is intentional, it needs clearer explanation. If not, it should be simplified.
6. Treat additional controls as follow-on enhancements
Potential backlog items:
Select all
manual add within import
reminder timing setup
tighter filtering rules
recurring reminder support
These can improve the experience, but they are not the immediate product decision.
Suggested product direction
The best next version is likely:
Design B's structure
Design A's restraint
stronger import affordance
more explicit confirmation feedback
In practical terms, that means the team should move forward with the categorized model, but resist the temptation to over-decorate it. The winning experience is the one that feels organized and confidence-building without becoming visually heavy.
Priority actions
Highest priority
Commit to Design B as the primary direction
Simplify Design B's visual presentation
Improve the discoverability of the import action
Resolve the completion-state ambiguity
Medium priority
Remove or better explain mixed-source items in the import list
Decide whether search belongs in this flow
Explore a hybrid confirmation treatment that combines the clarity of text with the speed of iconography
Lower priority
Add Select all
Add manual add from within import
Add reminder timing or recurrence options
Add more advanced filtering controls
Final takeaway
This research does not suggest that the team needs a new concept. It suggests that the team is close.
Users already see clear value in importing dates, and the newer organized layout is directionally better. The work now is to remove the last bits of ambiguity: make the way in clearer, make the outcome clearer, and keep the stronger Design B structure without letting the UI become noisy. That is the most credible path to a version that feels both easy and dependable.

