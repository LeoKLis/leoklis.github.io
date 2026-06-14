# Vizualizacija grafova i drva u pythonu

## Cilj
Napraviti framework koji ce olaksati vizualizaciju grafova (tipa nesto ovakvog). Ideja mi je da posto su grafovi vise manje jednako implementirani (objekt Node i lista pokazivaca na druge Node objekte), da se moze unificirati to u **VisualNode** koji automatski prikazuje graf.

Ugl mislim da je korisno kao projekt jer je lakse nauciti pola gradiva NASP-a. NASP je smece od predmeta jer se rade grafovi i drva, a objektivno je bolje uciti grafove/drva kada vidis algoritam vizualno sto radi.

<img src="https://i.sstatic.net/M9uL0.jpg" width="500px">

Ovakvo nesto zamisljam s animacijama i debugging moguconsti.

## Funkcionalni zahtjevi
- Korisnik samostalno pise kod/algoritam, ali koristi nasu implementaciju vrha grafa **VisualNode** ili tako nesto.
- Svaki taj **VisualNode** se prikazuje vizualno. 
- Povezivanjem cvorova **VisualNode** u pythonu (kroz kod referenciranjem) se vizualno povezuju cvorovi s bridovima.
- Idjea mi je koristiti Pygame ili Web Preglednik (na localhostu canvas) ili oboje.
- Kad korisnik promijeni kod i spremi datoteku, vizualizacija se resetira (live reload).
- Implementirati step by step rad algoritma kojeg korisnik napise u kodu.

## Nefunkcionalni zahtjevi
- Svi su funkcionalni i ekstremno bitni.
- Osim naravno dizajna koji treba biti **ssslicck** i intuitivan (uz mogucnost promjene boje + ceg se sjetim jos).
- I animacije trebaju postojati za **sliccck** debugging experience (ovakve animacije ocekujem za tranzicije u deguggingu).
<img src="https://cdn.dribbble.com/userupload/39937631/file/original-c461d055746b413c3782f77c2abd6269.gif" width="500px">