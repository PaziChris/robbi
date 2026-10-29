/* Robbi – Dialoge: kleine Alltagsszenen pro Sprache.
 * Jede Szene: Titel, Emoji, Rolle des Gegenübers und abwechselnd
 *   ['p', fremdsprachig, deutsch]            → das Gegenüber sagt etwas
 *   ['me', [[antwort, deutsch, true], ...]]  → du wählst die passende Antwort (die richtige hat "true")
 * {name} wird durch deinen Spitznamen ersetzt.
 */
export const DIALOGS = {
  Farsi: [
    { t: 'Taxi in Teheran', e: '🚕', who: 'Taxifahrer', d: [
      ['p', 'Salām, kojā tashrif mibarin?', 'Hallo, wohin fahren Sie?'],
      ['me', [['Salām, meydun-e Tajrish lotfan.', 'Hallo, zum Tadschrisch-Platz bitte.', true], ['Man gorosname.', 'Ich habe Hunger.'], ['Khodāfez!', 'Tschüss!']]],
      ['p', 'Chashm. Terāfik-e, ye kam tul mikeshe.', 'Gerne. Es ist Stau, es dauert ein bisschen.'],
      ['me', [['Eyb nadāre, ajale nadāram.', 'Kein Problem, ich habe es nicht eilig.', true], ['Chand sālet-e?', 'Wie alt bist du?'], ['Ghazā khoshmaze bud.', 'Das Essen war lecker.']]],
      ['p', 'Residim. Mishe sisad hezār tomān.', 'Wir sind da. Das macht 300.000 Toman.'],
      ['me', [['Befarmāyin, merci. Khaste nabāshin!', 'Bitte schön, danke. Danke für Ihre Mühe!', true], ['Salām, khubi?', 'Hallo, wie geht\'s?'], ['Ye chāy lotfan.', 'Einen Tee bitte.']]],
      ['p', 'Ghābeli nadāre! Ruz-e khosh!', 'Ist nicht der Rede wert (Taarof)! Schönen Tag!']
    ] },
    { t: 'Im Teehaus', e: '🫖', who: 'Kellner', d: [
      ['p', 'Salām, khosh umadin! Chi meyl dārin?', 'Hallo, willkommen! Was möchten Sie?'],
      ['me', [['Ye chāy lotfan, bā nabāt.', 'Einen Tee bitte, mit Nabat.', true], ['Dastshuyi kojā-st?', 'Wo ist die Toilette?'], ['Man az Otrish umadam.', 'Ich komme aus Österreich.']]],
      ['p', 'Chashm. Chizi ham barāye khordan mikhāyn?', 'Gerne. Möchten Sie auch etwas essen?'],
      ['me', [['Ye tikke keyk-e shokolāti lotfan.', 'Ein Stück Schokokuchen bitte.', true], ['Na, havā sard-e.', 'Nein, es ist kalt.'], ['Bebakhshid, dir kardam.', 'Entschuldigung, ich bin spät.']]],
      ['p', 'Befarmāyin. Nush-e jun!', 'Bitte schön. Guten Appetit!'],
      ['me', [['Merci, kheyli mamnun!', 'Danke, vielen Dank!', true], ['Khodāfez, fardā mibinamet.', 'Tschüss, bis morgen.'], ['Chand sālet-e?', 'Wie alt bist du?']]],
      ['p', 'Khāhesh mikonam!', 'Bitte sehr!']
    ] },
    { t: 'Neue Leute kennenlernen', e: '👋', who: 'Sara', d: [
      ['p', 'Salām! Esmet chi-e?', 'Hallo! Wie heißt du?'],
      ['me', [['Esmam {name}-e. To chi?', 'Ich heiße {name}. Und du?', true], ['Man chāy mikhām.', 'Ich will Tee.'], ['Bale, merci.', 'Ja, danke.']]],
      ['p', 'Man Sārā-m. Az kojā umadi?', 'Ich bin Sara. Woher kommst du?'],
      ['me', [['Az Otrish, az Vin.', 'Aus Österreich, aus Wien.', true], ['Sā\'at se-e.', 'Es ist drei Uhr.'], ['Ghazā khoshmaze-st.', 'Das Essen ist lecker.']]],
      ['p', 'Vāy, farsit kheyli khub-e!', 'Wow, dein Persisch ist sehr gut!'],
      ['me', [['Merci, dāram yād migiram.', 'Danke, ich lerne gerade.', true], ['Na, gerun-e.', 'Nein, das ist teuer.'], ['Khodāfez!', 'Tschüss!']]],
      ['p', 'Āfarin! Bāz ham bā ham harf bezanim.', 'Bravo! Lass uns wieder miteinander reden.']
    ] },
    { t: 'Auf dem Basar', e: '🧣', who: 'Händler', d: [
      ['p', 'Befarmāyin, chi mikhāyn?', 'Bitte schön, was möchten Sie?'],
      ['me', [['In shāl chand-e?', 'Wie viel kostet dieser Schal?', true], ['Ye chāy lotfan.', 'Einen Tee bitte.'], ['Esmam {name}-e.', 'Ich heiße {name}.']]],
      ['p', 'Barāye shomā, ye milyun tomān.', 'Für Sie eine Million Toman.'],
      ['me', [['Kheyli gerun-e! Takhfif midin?', 'Sehr teuer! Geben Sie Rabatt?', true], ['Bale, havā khub-e.', 'Ja, das Wetter ist schön.'], ['Merci, khodāfez.', 'Danke, tschüss.']]],
      ['p', 'Bāshe, hashtsad hezār. Ākharesh-e!', 'Okay, 800.000. Mein letztes Angebot!'],
      ['me', [['Bāshe, mikharamesh.', 'Okay, ich nehme ihn.', true], ['Man gorosname.', 'Ich habe Hunger.'], ['Sā\'at chand-e?', 'Wie spät ist es?']]],
      ['p', 'Mobārak bāshe!', 'Viel Freude damit!']
    ] }
  ],
  Griechisch: [
    { t: 'In der Taverne', e: '🍽️', who: 'Kellner', d: [
      ['p', 'Kalispéra! Ti tha párete?', 'Guten Abend! Was nehmen Sie?'],
      ['me', [['Éna suvláki ke mia choriátiki, parakaló.', 'Ein Souvlaki und einen Bauernsalat, bitte.', true], ['Pu íne i paralía?', 'Wo ist der Strand?'], ['Íme apó tin Afstría.', 'Ich komme aus Österreich.']]],
      ['p', 'Ke na piíte?', 'Und zu trinken?'],
      ['me', [['Mia bíra, parakaló.', 'Ein Bier, bitte.', true], ['Kaliméra!', 'Guten Morgen!'], ['Dhen xéro ti óra íne.', 'Ich weiß nicht, wie spät es ist.']]],
      ['p', 'Amésos! Kalí órexi!', 'Sofort! Guten Appetit!'],
      ['me', [['Efcharistó polí!', 'Vielen Dank!', true], ['Jia sas, ta léme ávrio!', 'Tschüss, bis morgen!'], ['Póso káni to isitírio?', 'Wie viel kostet die Fahrkarte?']]],
      ['p', 'Típota! Kalí sinéchia!', 'Gern geschehen! Noch einen schönen Abend!']
    ] },
    { t: 'Nach dem Weg fragen', e: '🗺️', who: 'Passantin', d: [
      ['p', 'Jia sas! Boró na sas voithíso?', 'Hallo! Kann ich Ihnen helfen?'],
      ['me', [['Ne, pu íne i Akrópoli?', 'Ja, wo ist die Akropolis?', true], ['Thélo éna kafé.', 'Ich möchte einen Kaffee.'], ['Íme kurazménos.', 'Ich bin müde.']]],
      ['p', 'Páte efthía ke metá dhexiá.', 'Gehen Sie geradeaus und dann rechts.'],
      ['me', [['Íne makriá?', 'Ist es weit?', true], ['Kalí órexi!', 'Guten Appetit!'], ['Chrónia polá!', 'Alles Gute!']]],
      ['p', 'Óchi, pénde leptá me ta pódia.', 'Nein, fünf Minuten zu Fuß.'],
      ['me', [['Efcharistó, kalí sas méra!', 'Danke, einen schönen Tag noch!', true], ['Dhen píno kafé.', 'Ich trinke keinen Kaffee.'], ['Póso chronón íse?', 'Wie alt bist du?']]],
      ['p', 'Parakaló! Kalí vólta!', 'Bitte! Einen schönen Spaziergang!']
    ] },
    { t: 'Neue Leute kennenlernen', e: '👋', who: 'Eleni', d: [
      ['p', 'Jia su! Pos se léne?', 'Hallo! Wie heißt du?'],
      ['me', [['Me léne {name}. Esé?', 'Ich heiße {name}. Und du?', true], ['Thélo neró.', 'Ich will Wasser.'], ['Ne, efcharistó.', 'Ja, danke.']]],
      ['p', 'Me léne Eléni. Apó pu íse?', 'Ich heiße Eleni. Woher kommst du?'],
      ['me', [['Íme apó tin Afstría, apó ti Viénni.', 'Ich komme aus Österreich, aus Wien.', true], ['Íne dhéka i óra.', 'Es ist zehn Uhr.'], ['To fajitó íne nóstimo.', 'Das Essen ist lecker.']]],
      ['p', 'Milás polí kalá elliniká!', 'Du sprichst sehr gut Griechisch!'],
      ['me', [['Efcharistó, mathéno akóma.', 'Danke, ich lerne noch.', true], ['Óchi, íne akrivó.', 'Nein, das ist teuer.'], ['Jia sas!', 'Tschüss!']]],
      ['p', 'Brávo! Páme jia kafé kápia stigmí?', 'Bravo! Gehen wir mal auf einen Kaffee?'],
      ['me', [['Ne, me charí!', 'Ja, sehr gerne!', true], ['Pu íne i tualéta?', 'Wo ist die Toilette?'], ['Dhen xéro.', 'Ich weiß nicht.']]],
      ['p', 'Téleia! Ta léme!', 'Perfekt! Bis bald!']
    ] },
    { t: 'Im Kafeneio', e: '☕', who: 'Wirt', d: [
      ['p', 'Kaliméra! Ti na sas féro?', 'Guten Morgen! Was darf ich bringen?'],
      ['me', [['Éna frédo espréso, parakaló.', 'Einen Freddo Espresso, bitte.', true], ['Pu íne to leoforío?', 'Wo ist der Bus?'], ['Me léne Robbie.', 'Ich heiße Robbie.']]],
      ['p', 'Me záchari í skéto?', 'Mit Zucker oder ohne?'],
      ['me', [['Métrio, parakaló.', 'Mittelsüß, bitte.', true], ['Kaliníchta!', 'Gute Nacht!'], ['Íme apó tin Elládha.', 'Ich komme aus Griechenland.']]],
      ['p', 'Oríste. Típota állo?', 'Bitte schön. Sonst noch etwas?'],
      ['me', [['Óchi, efcharistó. Ton logariasmó, parakaló.', 'Nein, danke. Die Rechnung, bitte.', true], ['Ne, thélo na kimithó.', 'Ja, ich will schlafen.'], ['Póso chronón íse?', 'Wie alt bist du?']]],
      ['p', 'Tría evró. Kalí sas méra!', 'Drei Euro. Schönen Tag!']
    ] }
  ],
  Italienisch: [
    { t: 'Al bar', e: '☕', who: 'Barista', d: [
      ['p', 'Buongiorno! Cosa prende?', 'Guten Morgen! Was nehmen Sie?'],
      ['me', [['Un cappuccino e un cornetto, per favore.', 'Einen Cappuccino und ein Hörnchen, bitte.', true], ['Dov\'è la stazione?', 'Wo ist der Bahnhof?'], ['Mi chiamo {name}.', 'Ich heiße {name}.']]],
      ['p', 'Al banco o al tavolo?', 'An der Theke oder am Tisch?'],
      ['me', [['Al banco, grazie.', 'An der Theke, danke.', true], ['Buonanotte!', 'Gute Nacht!'], ['Ho venticinque anni.', 'Ich bin 25 Jahre alt.']]],
      ['p', 'Ecco a lei. Sono tre euro.', 'Bitte schön. Das macht drei Euro.'],
      ['me', [['Ecco. Grazie, buona giornata!', 'Bitte. Danke, einen schönen Tag!', true], ['È troppo piccante.', 'Das ist zu scharf.'], ['Che ore sono?', 'Wie spät ist es?']]],
      ['p', 'Grazie a lei! Arrivederci!', 'Danke Ihnen! Auf Wiedersehen!']
    ] },
    { t: 'Nach dem Weg fragen', e: '🗺️', who: 'Passant', d: [
      ['p', 'Posso aiutarla?', 'Kann ich Ihnen helfen?'],
      ['me', [['Sì, dov\'è il Colosseo?', 'Ja, wo ist das Kolosseum?', true], ['Un caffè, per favore.', 'Einen Kaffee, bitte.'], ['Sono stanco.', 'Ich bin müde.']]],
      ['p', 'Vada dritto e poi giri a sinistra.', 'Gehen Sie geradeaus und dann links.'],
      ['me', [['È lontano?', 'Ist es weit?', true], ['Buon appetito!', 'Guten Appetit!'], ['Tanti auguri!', 'Alles Gute!']]],
      ['p', 'No, dieci minuti a piedi.', 'Nein, zehn Minuten zu Fuß.'],
      ['me', [['Grazie mille, gentilissimo!', 'Vielen Dank, sehr freundlich!', true], ['Non mangio carne.', 'Ich esse kein Fleisch.'], ['Quanti anni hai?', 'Wie alt bist du?']]],
      ['p', 'Prego! Buona passeggiata!', 'Bitte! Einen schönen Spaziergang!']
    ] },
    { t: 'Neue Leute kennenlernen', e: '👋', who: 'Marco', d: [
      ['p', 'Ciao! Come ti chiami?', 'Hallo! Wie heißt du?'],
      ['me', [['Mi chiamo {name}. E tu?', 'Ich heiße {name}. Und du?', true], ['Vorrei un gelato.', 'Ich hätte gern ein Eis.'], ['Sì, grazie.', 'Ja, danke.']]],
      ['p', 'Io sono Marco. Di dove sei?', 'Ich bin Marco. Woher kommst du?'],
      ['me', [['Vengo dall\'Austria, da Vienna.', 'Ich komme aus Österreich, aus Wien.', true], ['Sono le tre.', 'Es ist drei Uhr.'], ['Il conto, per favore.', 'Die Rechnung, bitte.']]],
      ['p', 'Parli bene l\'italiano!', 'Du sprichst gut Italienisch!'],
      ['me', [['Grazie, sto ancora imparando.', 'Danke, ich lerne noch.', true], ['No, è troppo caro.', 'Nein, das ist zu teuer.'], ['Arrivederci!', 'Auf Wiedersehen!']]],
      ['p', 'Bravo! Ci prendiamo un caffè?', 'Bravo! Trinken wir einen Kaffee?'],
      ['me', [['Sì, volentieri!', 'Ja, gerne!', true], ['Dov\'è il bagno?', 'Wo ist die Toilette?'], ['Non lo so.', 'Ich weiß es nicht.']]],
      ['p', 'Perfetto! A dopo!', 'Perfekt! Bis später!']
    ] }
  ],
  Spanisch: [
    { t: 'In der Tapas-Bar', e: '🍤', who: 'Kellner', d: [
      ['p', '¡Hola! ¿Qué te pongo?', 'Hallo! Was darf\'s sein?'],
      ['me', [['Unas patatas bravas y una caña, por favor.', 'Patatas bravas und ein kleines Bier, bitte.', true], ['¿Dónde está la playa?', 'Wo ist der Strand?'], ['Me llamo {name}.', 'Ich heiße {name}.']]],
      ['p', '¿Algo más?', 'Noch etwas?'],
      ['me', [['Sí, una ración de jamón.', 'Ja, eine Portion Schinken.', true], ['Buenas noches.', 'Gute Nacht.'], ['Tengo veinte años.', 'Ich bin zwanzig.']]],
      ['p', '¡Marchando! ¡Que aproveche!', 'Kommt sofort! Guten Appetit!'],
      ['me', [['¡Gracias! ¿Me cobras, por favor?', 'Danke! Kassierst du bitte?', true], ['¿Cómo te llamas?', 'Wie heißt du?'], ['Hace frío.', 'Es ist kalt.']]],
      ['p', 'Son doce euros. ¡Hasta luego!', 'Das macht zwölf Euro. Bis dann!']
    ] },
    { t: 'Nach dem Weg fragen', e: '🗺️', who: 'Passantin', d: [
      ['p', '¿Te puedo ayudar?', 'Kann ich dir helfen?'],
      ['me', [['Sí, ¿dónde está la catedral?', 'Ja, wo ist die Kathedrale?', true], ['Un café con leche.', 'Einen Milchkaffee.'], ['Estoy cansado.', 'Ich bin müde.']]],
      ['p', 'Sigue recto y luego a la derecha.', 'Geh geradeaus und dann rechts.'],
      ['me', [['¿Está lejos?', 'Ist es weit?', true], ['¡Que aproveche!', 'Guten Appetit!'], ['¡Feliz cumpleaños!', 'Alles Gute zum Geburtstag!']]],
      ['p', 'No, a cinco minutos andando.', 'Nein, fünf Minuten zu Fuß.'],
      ['me', [['¡Muchas gracias, muy amable!', 'Vielen Dank, sehr nett!', true], ['No como carne.', 'Ich esse kein Fleisch.'], ['¿Cuántos años tienes?', 'Wie alt bist du?']]],
      ['p', '¡De nada! ¡Buen paseo!', 'Gern geschehen! Schönen Spaziergang!']
    ] },
    { t: 'Neue Leute kennenlernen', e: '👋', who: 'Carlos', d: [
      ['p', '¡Hola! ¿Cómo te llamas?', 'Hallo! Wie heißt du?'],
      ['me', [['Me llamo {name}. ¿Y tú?', 'Ich heiße {name}. Und du?', true], ['Quiero un helado.', 'Ich will ein Eis.'], ['Sí, gracias.', 'Ja, danke.']]],
      ['p', 'Soy Carlos. ¿De dónde eres?', 'Ich bin Carlos. Woher kommst du?'],
      ['me', [['Soy de Austria, de Viena.', 'Ich komme aus Österreich, aus Wien.', true], ['Son las tres.', 'Es ist drei Uhr.'], ['La cuenta, por favor.', 'Die Rechnung, bitte.']]],
      ['p', '¡Hablas muy bien español!', 'Du sprichst sehr gut Spanisch!'],
      ['me', [['Gracias, todavía estoy aprendiendo.', 'Danke, ich lerne noch.', true], ['No, es muy caro.', 'Nein, das ist sehr teuer.'], ['¡Adiós!', 'Tschüss!']]],
      ['p', '¡Qué guay! ¿Quedamos para un café?', 'Cool! Treffen wir uns auf einen Kaffee?'],
      ['me', [['¡Sí, me encantaría!', 'Ja, sehr gerne!', true], ['¿Dónde está el baño?', 'Wo ist die Toilette?'], ['No sé.', 'Ich weiß nicht.']]],
      ['p', '¡Genial! ¡Hasta pronto!', 'Super! Bis bald!']
    ] }
  ],
  'Französisch': [
    { t: 'In der Bäckerei', e: '🥐', who: 'Bäckerin', d: [
      ['p', 'Bonjour ! Qu\'est-ce que je vous sers ?', 'Guten Tag! Was darf ich Ihnen geben?'],
      ['me', [['Bonjour, une baguette et deux croissants, s\'il vous plaît.', 'Guten Tag, ein Baguette und zwei Croissants, bitte.', true], ['Où est la gare ?', 'Wo ist der Bahnhof?'], ['Je m\'appelle {name}.', 'Ich heiße {name}.']]],
      ['p', 'Et avec ceci ?', 'Darf es noch etwas sein?'],
      ['me', [['C\'est tout, merci.', 'Das ist alles, danke.', true], ['Bonne nuit !', 'Gute Nacht!'], ['J\'ai vingt ans.', 'Ich bin zwanzig.']]],
      ['p', 'Ça fait quatre euros.', 'Das macht vier Euro.'],
      ['me', [['Voilà. Merci, bonne journée !', 'Bitte. Danke, einen schönen Tag!', true], ['C\'est trop épicé.', 'Das ist zu scharf.'], ['Il est quelle heure ?', 'Wie spät ist es?']]],
      ['p', 'Merci, à vous aussi !', 'Danke, Ihnen auch!']
    ] },
    { t: 'Nach dem Weg fragen', e: '🗺️', who: 'Passant', d: [
      ['p', 'Je peux vous aider ?', 'Kann ich Ihnen helfen?'],
      ['me', [['Oui, où est la tour Eiffel ?', 'Ja, wo ist der Eiffelturm?', true], ['Un café, s\'il vous plaît.', 'Einen Kaffee, bitte.'], ['Je suis fatigué.', 'Ich bin müde.']]],
      ['p', 'Allez tout droit, puis à gauche.', 'Gehen Sie geradeaus, dann links.'],
      ['me', [['C\'est loin ?', 'Ist es weit?', true], ['Bon appétit !', 'Guten Appetit!'], ['Joyeux anniversaire !', 'Alles Gute zum Geburtstag!']]],
      ['p', 'Non, dix minutes à pied.', 'Nein, zehn Minuten zu Fuß.'],
      ['me', [['Merci beaucoup, c\'est très gentil !', 'Vielen Dank, sehr nett!', true], ['Je mange pas de viande.', 'Ich esse kein Fleisch.'], ['Tu as quel âge ?', 'Wie alt bist du?']]],
      ['p', 'Je vous en prie ! Bonne promenade !', 'Gern geschehen! Schönen Spaziergang!']
    ] },
    { t: 'Neue Leute kennenlernen', e: '👋', who: 'Julien', d: [
      ['p', 'Salut ! Tu t\'appelles comment ?', 'Hallo! Wie heißt du?'],
      ['me', [['Je m\'appelle {name}. Et toi ?', 'Ich heiße {name}. Und du?', true], ['Je voudrais une glace.', 'Ich hätte gern ein Eis.'], ['Oui, merci.', 'Ja, danke.']]],
      ['p', 'Moi, c\'est Julien. Tu viens d\'où ?', 'Ich bin Julien. Woher kommst du?'],
      ['me', [['Je viens d\'Autriche, de Vienne.', 'Ich komme aus Österreich, aus Wien.', true], ['Il est trois heures.', 'Es ist drei Uhr.'], ['L\'addition, s\'il vous plaît.', 'Die Rechnung, bitte.']]],
      ['p', 'Tu parles super bien français !', 'Du sprichst super Französisch!'],
      ['me', [['Merci, j\'apprends encore.', 'Danke, ich lerne noch.', true], ['Non, c\'est trop cher.', 'Nein, das ist zu teuer.'], ['Au revoir !', 'Auf Wiedersehen!']]],
      ['p', 'Trop bien ! On prend un café un de ces jours ?', 'Cool! Trinken wir mal einen Kaffee?'],
      ['me', [['Oui, avec plaisir !', 'Ja, gerne!', true], ['Les toilettes, c\'est où ?', 'Wo ist die Toilette?'], ['Je sais pas.', 'Ich weiß nicht.']]],
      ['p', 'Génial ! À plus !', 'Super! Bis dann!']
    ] }
  ],
  Serbisch: [
    { t: 'In der Kafana', e: '🍖', who: 'Kellner', d: [
      ['p', 'Dobro veče! Izvolite, šta ćete?', 'Guten Abend! Bitte, was nehmen Sie?'],
      ['me', [['Porciju ćevapa i šopsku salatu, molim.', 'Eine Portion Ćevapi und einen Schopska-Salat, bitte.', true], ['Gde je stanica?', 'Wo ist der Bahnhof?'], ['Zovem se {name}.', 'Ich heiße {name}.']]],
      ['p', 'A za piće?', 'Und zu trinken?'],
      ['me', [['Jedno pivo, molim vas.', 'Ein Bier, bitte.', true], ['Laku noć!', 'Gute Nacht!'], ['Imam dvadeset godina.', 'Ich bin zwanzig.']]],
      ['p', 'Stiže odmah! Prijatno!', 'Kommt sofort! Guten Appetit!'],
      ['me', [['Hvala! Račun, molim.', 'Danke! Die Rechnung, bitte.', true], ['Kako se zoveš?', 'Wie heißt du?'], ['Hladno je.', 'Es ist kalt.']]],
      ['p', 'Hiljadu dinara. Hvala, doviđenja!', 'Tausend Dinar. Danke, auf Wiedersehen!']
    ] },
    { t: 'Auf dem Markt', e: '🍅', who: 'Marktfrau', d: [
      ['p', 'Izvolite! Šta vam treba?', 'Bitte schön! Was brauchen Sie?'],
      ['me', [['Koliko košta paradajz?', 'Wie viel kosten die Tomaten?', true], ['Jednu kafu, molim.', 'Einen Kaffee, bitte.'], ['Umoran sam.', 'Ich bin müde.']]],
      ['p', 'Dvesta dinara kilo.', 'Zweihundert Dinar das Kilo.'],
      ['me', [['Može malo jeftinije?', 'Geht es ein bisschen billiger?', true], ['Prijatno!', 'Guten Appetit!'], ['Srećan rođendan!', 'Alles Gute zum Geburtstag!']]],
      ['p', 'Ajde, sto pedeset, samo za vas!', 'Na gut, hundertfünfzig, nur für Sie!'],
      ['me', [['Važi, dajte mi dva kila.', 'Abgemacht, geben Sie mir zwei Kilo.', true], ['Ne jedem meso.', 'Ich esse kein Fleisch.'], ['Koliko imaš godina?', 'Wie alt bist du?']]],
      ['p', 'Izvolite! Prijatno!', 'Bitte schön! Lassen Sie es sich schmecken!']
    ] },
    { t: 'Neue Leute kennenlernen', e: '👋', who: 'Marko', d: [
      ['p', 'Ćao! Kako se zoveš?', 'Hallo! Wie heißt du?'],
      ['me', [['Zovem se {name}. A ti?', 'Ich heiße {name}. Und du?', true], ['Hoću sladoled.', 'Ich will ein Eis.'], ['Da, hvala.', 'Ja, danke.']]],
      ['p', 'Ja sam Marko. Odakle si?', 'Ich bin Marko. Woher kommst du?'],
      ['me', [['Iz Austrije sam, iz Beča.', 'Ich komme aus Österreich, aus Wien.', true], ['Tri sata je.', 'Es ist drei Uhr.'], ['Račun, molim.', 'Die Rechnung, bitte.']]],
      ['p', 'Baš dobro pričaš srpski!', 'Du sprichst richtig gut Serbisch!'],
      ['me', [['Hvala, još učim.', 'Danke, ich lerne noch.', true], ['Ne, preskupo je.', 'Nein, das ist zu teuer.'], ['Doviđenja!', 'Auf Wiedersehen!']]],
      ['p', 'Svaka čast! Idemo na kafu nekad?', 'Respekt! Gehen wir mal auf einen Kaffee?'],
      ['me', [['Važi, rado!', 'Abgemacht, gerne!', true], ['Gde je toalet?', 'Wo ist die Toilette?'], ['Ne znam.', 'Ich weiß nicht.']]],
      ['p', 'Super! Vidimo se!', 'Super! Wir sehen uns!']
    ] }
  ]
};
