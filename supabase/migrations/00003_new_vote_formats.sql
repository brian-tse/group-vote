-- Add 5 new vote format types
alter type vote_format add value 'date_poll';
alter type vote_format add value 'approval';
alter type vote_format add value 'rsvp';
alter type vote_format add value 'score_rating';
alter type vote_format add value 'multi_select';
