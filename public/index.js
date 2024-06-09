const criteria = document.querySelector('.container__input');
const btn = document.querySelector('.container__button');
const resultsDiv = document.querySelector('.container__results');

btn.addEventListener('click', async (e) => {
    e.preventDefault();
    resultsDiv.innerHTML = ''; // Clear previous results as soon as search is initiated
    const name = criteria.value.trim();
    if (name) {
        const keywords = generateKeywords(name);
        const profileLinks = generateProfileLinks(keywords);
        const searchLinks = generateSearchLinks(keywords);

        try {
            const validProfileLinks = await validateLinks(profileLinks);
            displayProfileResults(validProfileLinks);
            displaySearchResults(searchLinks);
        } catch (error) {
            console.error('Error:', error.message);
            resultsDiv.textContent = 'An error occurred while fetching data. Please try again later.';
        }
    }
});

function generateKeywords(name) {
    const nameParts = name.split(' ');
    const keywords = [name];

    if (nameParts.length > 1) {
        const [firstName, lastName] = nameParts;
        keywords.push(firstName);
        keywords.push(lastName);
        keywords.push(`${firstName} ${lastName}`);
        keywords.push(`${lastName} ${firstName}`);
        keywords.push(`${firstName}${lastName}`); // concatenated first and last name
        keywords.push(`${lastName}${firstName}`); // concatenated last and first name

        const randomNicknames = generateRandomNicknames(firstName, lastName);
        randomNicknames.forEach(nickname => {
            keywords.push(nickname);
            keywords.push(`${nickname} ${lastName}`);
        });
    } else {
        const randomNicknames = generateRandomNicknames(nameParts[0], '');
        randomNicknames.forEach(nickname => {
            keywords.push(nickname);
        });
    }

    return keywords;
}

function generateRandomNicknames(firstName, lastName) {
    const nicknames = [];
    const randomIndex = () => Math.floor(Math.random() * firstName.length);
    const nickname1 = firstName.slice(0, randomIndex() + 1);
    const nickname2 = firstName.slice(randomIndex(), firstName.length);
    const nickname3 = `${nickname1}${lastName.slice(0, 1)}`;

    nicknames.push(nickname1, nickname2, nickname3);
    return nicknames;
}

function generateProfileLinks(keywords) {
    const platforms = {
        Facebook: 'https://www.facebook.com/',
        Instagram: 'https://www.instagram.com/',
        Twitter: 'https://twitter.com/'
    };

    const links = [];

    keywords.forEach(keyword => {
        for (const [platform, url] of Object.entries(platforms)) {
            links.push(`${url}${encodeURIComponent(keyword)}`);
        }
    });

    return links;
}

function generateSearchLinks(keywords) {
    const platforms = {
        Facebook: 'https://www.facebook.com/search/top/?q=',
        Instagram: 'https://www.instagram.com/explore/tags/',
        Twitter: 'https://twitter.com/search?q='
    };

    const links = [];

    keywords.forEach(keyword => {
        for (const [platform, url] of Object.entries(platforms)) {
            links.push(`${url}${encodeURIComponent(keyword)}`);
        }
    });

    return links;
}

async function validateLinks(links) {
    try {
        const response = await fetch('https://vu-epp-romans-projects-98192d1c.vercel.app/check-links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ links })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const results = await response.json();
        return results;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function displayProfileResults(results) {
    const profileResultsDiv = document.createElement('div');
    profileResultsDiv.classList.add('profile-results');
    profileResultsDiv.innerHTML = '<h2>Profile Results</h2>';
    resultsDiv.appendChild(profileResultsDiv);

    for (const [link, exists] of Object.entries(results)) {
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.innerText = exists ? `User exists on ${link.split('/')[2]}` : `User does not exist on ${link.split('/')[2]}`;
        a.style.display = 'block';
        a.style.margin = '5px 0';
        profileResultsDiv.appendChild(a);
    }
}

function displaySearchResults(links) {
    const searchResultsDiv = document.createElement('div');
    searchResultsDiv.classList.add('search-results');
    searchResultsDiv.innerHTML = '<h2>Search Results</h2>';
    resultsDiv.appendChild(searchResultsDiv);

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.innerText = `Search for "${decodeURIComponent(link.split('?q=')[1] || link.split('/tags/')[1])}" on ${link.split('.')[1]}`;
        a.style.display = 'block';
        a.style.margin = '5px 0';
        searchResultsDiv.appendChild(a);
    });
}
